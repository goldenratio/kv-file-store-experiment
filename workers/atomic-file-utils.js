import { appendFile, open, readFile, unlink, writeFile } from 'node:fs/promises';
import {existsSync, writeFileSync, readFileSync} from 'node:fs';

const lockFileSuffix = '-lock';

/**
 * @param {string} filePath
 * @param {string} data
 * @return {Promise<void>}
 */
export async function atomicWriteFile(filePath, data) {
  return new Promise((resolve, reject) => {
    const perform = () => {
      if (isLockExist(filePath)) {
        // wait till lock is released
        setTimeout(perform, 1);
      } else {
        writeFileSync(filePath, data, { encoding: 'utf8' });
        resolve();
        // createLockFile(filePath)
        //   .catch(() => {
        //     // wait till lock is released
        //     setTimeout(perform, 1);
        //   })
        //   .then(() => writeFile(filePath, data, { encoding: 'utf8' }))
        //   .then(() => deleteLockFile(filePath))
        //   .then(() => resolve())
        //   .catch(err => reject(err));
      }
    };

    perform();
  })
}

/**
 * @param {string} filePath
 * @return {Promise<string>}
 */
export async function atomicReadFile(filePath) {
  return new Promise((resolve, reject) => {
    const perform = () => {
      if (isLockExist(filePath)) {
        // wait till lock is released
        setTimeout(perform, 1);
      } else {
        const data = readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        resolve(data);
        // createLockFile(filePath)
        //   .catch(() => {
        //     // wait till lock is released
        //     setTimeout(perform, 1);
        //   })
        //   .then(() => readFile(filePath, { encoding: 'utf8' }))
        //   .then(data => {
        //     return deleteLockFile(filePath)
        //       .then(() => data)
        //   })
        //   .then(data => resolve(data))
        //   .catch(err => reject(err));
      }
    };

    perform();
  })
}

/**
 * @param {string} filePath
 * @return {boolean}
 */
function isLockExist(filePath) {
  return existsSync(filePath + lockFileSuffix);
}

/**
 * @param {string} filePath
 * @return {Promise<void>}
 */
async function createLockFile(filePath) {
  try {
    const fileHandle = await open(filePath + lockFileSuffix, 'a');
    await fileHandle.close();
  } catch (err) {
    await Promise.reject(err);
  }
}

/**
 * @param {string} filePath
 * @return {Promise<void>}
 */
async function deleteLockFile(filePath) {
  const lockFilePath = filePath + lockFileSuffix;

  if (!existsSync(lockFilePath)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    unlink(lockFilePath)
      .then(() => resolve())
      // we fail safely intentionally, lock file maybe already deleted
      .catch(() => resolve());
  });
}
