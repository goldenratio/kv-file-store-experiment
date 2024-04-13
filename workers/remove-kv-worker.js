import { parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';

import { atomicWriteFile } from './atomic-file-utils.js';

const key = workerData.key;
readFile(workerData.dbFilePath,  { encoding: 'utf8' })
  .then(data => {
    if (parentPort) {
      const lines= data.split('\n');
      const selectedLineIndex = lines.findIndex((value) => value.includes(key));
      if (selectedLineIndex >= 0) {
        lines.splice(selectedLineIndex, 1);
        const updatedContent = lines.join('\n');
        return Promise.resolve(updatedContent);
      }
    }
    return Promise.resolve(undefined);
  })
  .then(data => {
    if (typeof data === 'string') {
      parentPort.postMessage('removing key: ' + key);
      return atomicWriteFile(workerData.dbFilePath, data);
    } else {
      parentPort.postMessage('unable to remove key: ' + key);
    }
  })
  .catch(() => {
    if (parentPort) {
      parentPort.postMessage(undefined);
    }
  });

