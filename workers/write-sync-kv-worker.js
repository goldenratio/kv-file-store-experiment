import { parentPort, workerData, isMainThread } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';

export default function run(filePath, key, value) {
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

  const selectedLineIndex = lines.findIndex((value) => {
    const pKey = value.split(':')[0];
    return pKey === key;
  });

  if (selectedLineIndex >= 0) {
    lines[selectedLineIndex] = `${key}:${value}`;
    // lines.splice(selectedLineIndex, 1);
  } else {
    lines.push(`${key}:${value}`);
  }

  data = lines.join('\n');

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
  const value = workerData.value;
  const filePath = workerData.dbFilePath;
  run(filePath, key, value);
}
