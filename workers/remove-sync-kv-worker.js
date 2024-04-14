import { parentPort, workerData, isMainThread } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';

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

  const selectedLineIndex = lines.findIndex((value) => value.includes(key));
  if (selectedLineIndex >= 0) {
    lines.splice(selectedLineIndex, 1);
    data = lines.join('\n');
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
