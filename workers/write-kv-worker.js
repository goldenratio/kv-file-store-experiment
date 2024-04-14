import { parentPort, workerData } from 'node:worker_threads';

import { atomicReadFileAsync, atomicWriteFileAsync } from './atomic-file-utils.js';

const key = workerData.key;
const value = workerData.value;

atomicReadFileAsync(workerData.dbFilePath)
  .then(data => {
    const lines= data.split('\n');
    const selectedLineIndex = lines.findIndex((value) => value.includes(key));
    if (selectedLineIndex >= 0) {
      lines.splice(selectedLineIndex, 1);
      const updatedContent = lines.join('\n');
      return Promise.resolve(updatedContent);
    }
    return Promise.resolve(data);
  })
  .then(data => {
    const updatedData = data + `${key}:${value}\n`;
    return atomicWriteFileAsync(workerData.dbFilePath, updatedData);
  })
  .then(() => {
    parentPort.postMessage({ success: true });
  })
  .catch(err => {
    parentPort.postMessage({ success: false, reason: err });
  });
