import path from 'node:path';

import { removeFile, touchFile } from './utils/file-utils.js';
import { TaskManager } from './utils/task-manager.js';
import {getValueFromDb, removeKeyValueFromDb, setKeyValueToDb} from './utils/db-utils.js';
import { Metrics } from './utils/metrics.js';

export interface KVConfig {
  readonly dbFileName: string,
  readonly concurrentOperations: number,
  readonly useMainThread: boolean,
}

export class KeyValueStore {
  private readonly _kvConfig: KVConfig;
  private readonly _taskManager: TaskManager;
  protected readonly _metrics: Metrics;

  private _isInitialized: boolean = false;

  constructor(config: KVConfig) {
    console.log('KeyValueStore, config: ', config);
    this._kvConfig = config;
    this._taskManager = new TaskManager(this._kvConfig.concurrentOperations);
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

    this._taskManager.clearSchedule(key);

    return new Promise<boolean>(resolve => {
      let metricId: number = -1;
      const task = () => {
        metricId = this._metrics.begin('set');
        return setKeyValueToDb(this._kvConfig.dbFileName, key, value, this._kvConfig.useMainThread);
      };

      this._taskManager.add(task, success => {
        this._metrics.end(metricId, success, !success ? `failed to write key ${key}, with value ${value}, to db` : '');
          if (success) {
            this.scheduleKeyForExpiration(key, expiryTimeInMs);
          }
          resolve(success);
        });
    });
  }

  async getValue(key: string): Promise<number | undefined> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    return new Promise<number | undefined>(resolve => {
      let metricId: number = -1;
      const task = () => {
        metricId = this._metrics.begin('get');
        return getValueFromDb(this._kvConfig.dbFileName, key, this._kvConfig.useMainThread);
      }
      this._taskManager.add(task, ({ value, success }) => {
        this._metrics.end(metricId, success, !success ? `failed to get value for key: ${key}, from db` : '');
        resolve(value);
      });
    });

  }

  get metrics(): Metrics {
    return this._metrics;
  }

  private scheduleKeyForExpiration(key: string, expiryTimeInMs: number): void {
    if (expiryTimeInMs < 0 || expiryTimeInMs === Infinity) {
      return;
    }
    const task = () => removeKeyValueFromDb(this._kvConfig.dbFileName, key, this._kvConfig.useMainThread);
    this._taskManager.schedule(task, expiryTimeInMs, key, (keyRemoved) => {
      if (!keyRemoved) {
        console.log(`key ${key} failed to be removed by scheduler!`);
      }
    });
  }
}
