import { parentPort, workerData, isMainThread } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * @param filePath
 * @param {string | string[] } key
 * @return {boolean}
 */
export default function run(filePath, key) {
  let data = '';
  try {
    data = readFileSync(filePath, { encoding: 'utf8' });
  } catch (err) {
    if (!isMainThread && parentPort) {
      parentPort.postMessage({ success: false, reason: err.message });
    }
    return false;
  }
  const lines= data.split('\n');

  if (typeof key === 'string') {
    const selectedLineIndex = lines.findIndex((value) => {
      const pKey = value.split(':')[0];
      return pKey === key;
    });
    if (selectedLineIndex >= 0) {
      lines[selectedLineIndex] = '';
      // lines.splice(selectedLineIndex, 1);
      data = lines.join('\n');
    }
  } else {
    const selectedLineIndexes = key
      .map(keyToFind => lines.findIndex(lineValue => {
        const pKey = lineValue.split(':')[0];
        return pKey === keyToFind;
      }))
      .sort((a, b) => b - a);

    if (selectedLineIndexes.length > 0) {
      selectedLineIndexes.forEach(lineIndex => {
        lines[lineIndex] = '';
        // lines.splice(lineIndex, 1);
      });
      data = lines.join('\n');
    }
  }

  try {
    writeFileSync(filePath, data, { encoding: 'utf8' });
  } catch (err) {
    if (!isMainThread && parentPort) {
      parentPort.postMessage({ success: false, reason: err.message });
    }
    return false;
  }

  if (!isMainThread && parentPort) {
    parentPort.postMessage({ success: true });
  }

  return true;
}

if (!isMainThread) {
  const key = workerData.key;
  const filePath = workerData.dbFilePath;
  run(filePath, key);
}
