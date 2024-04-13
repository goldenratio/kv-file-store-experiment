import path from 'node:path';

import { removeFile, touchFile } from './utils/file-utils.js';
import { TaskManager } from './utils/task-manager.js';
import { getValueFromDb, removeKeyValueFromDb, setKeyValueToDb } from './utils/db-utils.js';

interface KVConfig {
  readonly dbFileName: string,
  readonly concurrentThreads: number
}

export class KeyValueStore {
  private readonly _kvConfig: KVConfig;
  private readonly _taskManager: TaskManager;

  private _isInitialized: boolean = false;

  constructor(config: KVConfig) {
    console.log('KeyValueStore, config: ', config);
    this._kvConfig = config;
    this._taskManager = new TaskManager(this._kvConfig.concurrentThreads);
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
      this._taskManager.add(
        () => setKeyValueToDb(this._kvConfig.dbFileName, key, value),
        success => {
          if (expiryTimeInMs >= 0 && expiryTimeInMs < Infinity) {
            this._taskManager.schedule(() => removeKeyValueFromDb(this._kvConfig.dbFileName, key), expiryTimeInMs, key);
          }
          resolve(success);
        });
    });
  }

  async getValue(key: string): Promise<number | undefined> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    const task = () => getValueFromDb(this._kvConfig.dbFileName, key);

    return new Promise<number | undefined>((resolve) => {
      this._taskManager.add(task, (value) => {
        resolve(value);
      });
    });

  }
}
