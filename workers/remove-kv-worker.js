import { parentPort, workerData } from 'node:worker_threads';

import { atomicWriteFile, atomicReadFile } from './atomic-file-utils.js';

const key = workerData.key;

atomicReadFile(workerData.dbFilePath)
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
    if (typeof data === 'string') {
      return atomicWriteFile(workerData.dbFilePath, data);
    } else {
      parentPort.postMessage({ success: false });
    }
  })
  .then(() => parentPort.postMessage({ success: true }))
  .catch(err => {
    parentPort.postMessage({ success: false, reason: err });
  });

