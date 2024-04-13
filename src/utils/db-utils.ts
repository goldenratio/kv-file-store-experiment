import path from 'node:path';
import { Worker } from 'node:worker_threads';

export async function setKeyValueToDb(dbFileName: string, key: string, value: number): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const workerFilePath = path.resolve('workers', 'write-kv-worker.js');
    const dbFilePath = path.resolve(dbFileName);

    const options = { workerData: { dbFilePath: dbFilePath, key: key, value: value } }
    const worker = new Worker(workerFilePath, options);
    let success: boolean = false;
    worker.on('message', (data) => {
      // console.log(`setting key: ${key} `, data);
      if (data && typeof data['success'] === 'boolean') {
        success = data['success'];
      }

      if (!success) {
        console.log('setKey: ', key, data['reason']);
      }
    });

    worker.on('error', error => {
      console.log(`error writing key ${key} : ${error.message}`);
    });

    worker.on('exit', () => {
      // console.log('worker exit ', key);
      resolve(success);
    });
  });
}

export async function getValueFromDb(dbFileName: string, key: string): Promise<{ value: number | undefined, success: boolean }> {
  return new Promise<{ value: number | undefined, success: boolean }>(resolve => {
    const workerFilePath = path.resolve('workers', 'read-kv-worker.js');
    const dbFilePath = path.resolve(dbFileName);

    const worker = new Worker(workerFilePath, { workerData: { dbFilePath: dbFilePath, key: key } });
    let value: number | undefined = undefined;
    let success: boolean = false;

    worker.on('message', (data) => {
      if (data && typeof data['success'] === 'boolean') {
        success = data['success'];
      }

      if (data && typeof data['value'] === 'number') {
        value = data['value'];
      }

      if (!success) {
        console.log('getValue: ', key, data['reason']);
      }
    });

    worker.on('error', error => {
      console.log(`error reading key ${key} : ${error.message}`);
    });

    worker.on('exit', () => {
      // console.log('worker exit ', key);
      resolve({ value, success });
    });
  });
}

export async function removeKeyValueFromDb(dbFileName: string, key: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const workerFilePath = path.resolve('workers', 'remove-kv-worker.js');
    const dbFilePath = path.resolve(dbFileName);

    const worker = new Worker(workerFilePath, { workerData: { dbFilePath: dbFilePath, key: key } });
    let success: boolean = false;

    worker.on('message', (data) => {
      if (data && typeof data['success'] === 'boolean') {
        success = data['success'];
      }

      if (!success) {
        console.log('removeKey failed: ', key, data['reason']);
      }
    });

    worker.on('error', error => {
      console.log(`error removing key ${key} : ${error.message}`);
    });

    worker.on('exit', () => {
      // console.log('worker exit ', key);
      resolve(success);
    });
  });
}
