import { appendFile, open, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const lockFileSuffix = '-lock';

/**
 * @param {string} filePath
 * @param {string} data
 * @returns {Promise<void>}
 */
export async function atomicAppendFile(filePath, data) {
  return new Promise((resolve, reject) => {
    const perform = () => {
      if (isLockExist(filePath)) {
        // wait till lock is released
        setTimeout(perform, 1);
      } else {
        // appendFile(filePath, data)
        createLockFile(filePath)
          .then(() => appendFile(filePath, data))
          .then(() => deleteLockFile(filePath))
          .then(() => resolve())
          .catch(err => reject(err));
      }
    };

    perform();
  });
}

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
        // writeFile(filePath, data, { encoding: 'utf8' })
        createLockFile(filePath)
          .then(() => writeFile(filePath, data, { encoding: 'utf8' }))
          .then(() => deleteLockFile(filePath))
          .then(() => resolve())
          .catch(err => reject(err));
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
        // writeFile(filePath, data, { encoding: 'utf8' })
        createLockFile(filePath)
          .then(() => readFile(filePath, { encoding: 'utf8' }))
          .then(data => {
            return deleteLockFile(filePath)
              .then(() => data)
          })
          .then(data => resolve(data))
          .catch(err => reject(err));
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
