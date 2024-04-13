import path from 'node:path';

import { removeFile, touchFile } from './utils/file-utils.js';
import { TaskManager } from './utils/task-manager.js';
import { getValueFromDb, removeKeyValueFromDb, setKeyValueToDb } from './utils/db-utils.js';
import { MetricData, Metrics } from './utils/metrics.js';

interface KVConfig {
  readonly dbFileName: string,
  readonly concurrentThreads: number
}

export class KeyValueStore {
  private readonly _kvConfig: KVConfig;
  private readonly _taskManager: TaskManager;
  protected readonly _metrics: Metrics;

  private _isInitialized: boolean = false;

  constructor(config: KVConfig) {
    console.log('KeyValueStore, config: ', config);
    this._kvConfig = config;
    this._taskManager = new TaskManager(this._kvConfig.concurrentThreads);
    this._metrics = new Metrics();
  }

  async init(): Promise<void> {
    const dbFilePath = path.resolve(this._kvConfig.dbFileName);
    await removeFile(dbFilePath);
    await removeFile(dbFilePath + '-lock');
    await touchFile(dbFilePath);
    this._isInitialized = true;
  }

  setValue(key: string, value: number, expiryTimeInMs: number = Infinity): Promise<boolean> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    const metricId = this._metrics.begin('set');
    this._taskManager.clearSchedule(key);

    return new Promise<boolean>(resolve => {
      const task = () => setKeyValueToDb(this._kvConfig.dbFileName, key, value);
      this._taskManager.add(task, success => {
          // schedule key expiry
          if (expiryTimeInMs >= 0 && expiryTimeInMs < Infinity) {
            const scheduleTask = () => removeKeyValueFromDb(this._kvConfig.dbFileName, key);
            this._taskManager.schedule(scheduleTask, expiryTimeInMs, key, (_keyRemoved) => {
              // kv removed by scheduler
            });
          }
          this._metrics.end(metricId, success, !success ? `failed to write key ${key}, with value ${value}, to db` : '');
          resolve(success);
        });
    });
  }

  async getValue(key: string): Promise<number | undefined> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    const metricId = this._metrics.begin('get');

    const task = () => getValueFromDb(this._kvConfig.dbFileName, key);
    return new Promise<number | undefined>((resolve) => {
      this._taskManager.add(task, ({ value, success }) => {
        this._metrics.end(metricId, success, !success ? `failed to get value for key: ${key}, from db` : '');
        resolve(value);
      });
    });

  }

  getMetricsLog(): ReadonlyArray<MetricData> {
    return this._metrics.getLogs();
  }
}
