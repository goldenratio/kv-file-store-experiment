import path from 'node:path';

import { removeFile, touchFile } from './utils/file-utils.js';
import { TaskManager } from './utils/task-manager.js';
import {getValueFromDb, removeKeyValueFromDb, setKeyValueToDb} from './utils/db-utils.js';
import { Metrics } from './utils/metrics.js';
import { notEmpty } from './utils/type-utils.js';

export interface KVConfig {
  readonly dbFileName: string,
  readonly concurrentOperations: number,
  readonly useMainThread: boolean,
}

export class KeyValueStore {
  private readonly _kvConfig: KVConfig;
  private readonly _taskManager: TaskManager;
  private readonly _metrics: Metrics;
  private readonly _keyExpiryTimeMap = new Map<string, number>();
  private readonly _activeKeyExpirationTimer: NodeJS.Timeout;

  private _isInitialized: boolean = false;
  private _keyCleanupBusy: boolean = false;

  constructor(config: KVConfig) {
    console.log('KeyValueStore, config: ', config);
    this._kvConfig = config;
    this._taskManager = new TaskManager(this._kvConfig.concurrentOperations);
    this._metrics = new Metrics();

    // active key expiration handler
    this._activeKeyExpirationTimer = setInterval(() => {
      this.cleanupExpiredKeys();
    }, 100);
  }

  async init(): Promise<void> {
    const dbFilePath = path.resolve(this._kvConfig.dbFileName);
    await removeFile(dbFilePath);
    await touchFile(dbFilePath);
    this._isInitialized = true;
  }

  setValue(key: string, value: number, expiryTimeInMs: number = Infinity): Promise<boolean> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    this._keyExpiryTimeMap.set(key, Date.now() + expiryTimeInMs);

    return new Promise<boolean>(resolve => {
      let metricId: number = -1;
      const task = () => {
        metricId = this._metrics.begin('set');
        return setKeyValueToDb(this._kvConfig.dbFileName, key, value, this._kvConfig.useMainThread);
      };

      this._taskManager.add(task, success => {
        this._metrics.end(metricId, success, !success ? `failed to write key ${key}, with value ${value}, to db` : '');
          resolve(success);
        });
    });
  }

  getValue(key: string): Promise<number | undefined> {
    if (!this._isInitialized) {
      throw Error('KV not initialized');
    }

    return new Promise<number | undefined>(resolve => {
      // passive key expiration handling
      if (this.hasKeyExpired(key)) {
        removeKeyValueFromDb(this._kvConfig.dbFileName, key, this._kvConfig.useMainThread)
          .then(success => {
            if (success) {
              this._keyExpiryTimeMap.delete(key);
            }
            resolve(undefined);
          });
        resolve(undefined);
        return;
      }

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

  private hasKeyExpired(key: string): boolean {
    const cachedKeyExpiryTime = this._keyExpiryTimeMap.get(key);
    return typeof cachedKeyExpiryTime === 'number' && cachedKeyExpiryTime < Date.now();
  }

  private cleanupExpiredKeys(): Promise<void> {
    if (this._keyCleanupBusy) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      const expiredKeys = [... this._keyExpiryTimeMap.entries()]
        .map(([key, expiryTime]) => {
          if (expiryTime < Date.now()) {
            return key;
          }
          return undefined;
        })
        .filter(notEmpty);

      if (expiredKeys.length > 0) {
        this._keyCleanupBusy = true;
        removeKeyValueFromDb(this._kvConfig.dbFileName, expiredKeys, this._kvConfig.useMainThread)
          .then(success => {
            if (success) {
              expiredKeys.forEach(key => this._keyExpiryTimeMap.delete(key));
            }

            this._keyCleanupBusy = false;
            if (this._keyExpiryTimeMap.size === 0) {
              clearInterval(this._activeKeyExpirationTimer);
            }
            resolve();
          });
        return;
      }
      resolve();
    });
  }
}
