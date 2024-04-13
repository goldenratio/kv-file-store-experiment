import { parentPort, workerData } from 'node:worker_threads';

import { atomicReadFile } from './atomic-file-utils.js';

const key = workerData.key;
atomicReadFile(workerData.dbFilePath)
  .then(data => {
    const lines= data.split('\n');
    const selectedValue = lines.find((value) => value.includes(key)).split(':')[1];
    const value = Number(selectedValue);
    if (!isNaN(value)) {
      parentPort.postMessage(value);
    } else {
      parentPort.postMessage(undefined);
    }
  })
  .catch(() => {
    parentPort.postMessage(undefined);
  });

