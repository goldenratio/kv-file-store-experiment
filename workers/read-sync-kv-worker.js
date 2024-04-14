import { parentPort, workerData, isMainThread } from 'node:worker_threads';
import { readFileSync } from 'node:fs';

/**
 * @param filePath
 * @param key
 * @return {{success: boolean, value: number}|{reason: string, success: boolean, value: undefined}}
 */
export default function run(filePath, key) {
  let data = '';
  try {
    data = readFileSync(filePath, { encoding: 'utf8' });
  } catch (err) {
    const result = { success: false, value: undefined, reason: err.message };
    if (!isMainThread && parentPort) {
      parentPort.postMessage(result);
    }
    return result;
  }

  const lines= data.split('\n');
  const selectedLine = lines.find(value => {
    const pKey = value.split(':')[0];
    return pKey === key;
  });

  const selectedValue = selectedLine?.split(':')[1];
  const value = Number(selectedValue);

  let result;

  if (!isNaN(value)) {
    result = { success: true, value: value };
  } else {
    result = { success: true, value: undefined };
  }

  if (!isMainThread && parentPort) {
    parentPort.postMessage(result);
  }

  return result;
}

if (!isMainThread) {
  const key = workerData.key;
  const filePath = workerData.dbFilePath;
  run(filePath, key);
}
