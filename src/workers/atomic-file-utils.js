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
        setTimeout(perform, 10);
      } else {
        // appendFile(filePath, data)
        createLockFile(filePath)
          .then(() => appendFile(filePath, data))
          .then(() => deleteLockFile(filePath))
          .then(() => resolve())
          .catch(() => reject());
      }
    };

    perform();
  });
}

export async function atomicWriteFile(filePath, data) {
  return new Promise((resolve, reject) => {
    const perform = () => {
      if (isLockExist(filePath)) {
        // wait till lock is released
        setTimeout(perform, 10);
      } else {
        // writeFile(filePath, data, { encoding: 'utf8' })
        createLockFile(filePath)
          .then(() => writeFile(filePath, data, { encoding: 'utf8' }))
          .then(() => deleteLockFile(filePath))
          .then(() => resolve())
          .catch(() => reject());
      }
    };

    perform();
  })
}

export async function atomicReadFile(filePath) {
  return new Promise((resolve, reject) => {
    const perform = () => {
      if (isLockExist(filePath)) {
        // wait till lock is released
        setTimeout(perform, 10);
      } else {
        // writeFile(filePath, data, { encoding: 'utf8' })
        createLockFile(filePath)
          .then(() => readFile(filePath, { encoding: 'utf8' }))
          .then(data => {
            return deleteLockFile(filePath)
              .then(() => data)
          })
          .then(data => resolve(data))
          .catch(() => reject());
      }
    };

    perform();
  })
}

function isLockExist(filePath) {
  return existsSync(filePath + lockFileSuffix);
}

async function createLockFile(filePath) {
  try {
    const fileHandle = await open(filePath + lockFileSuffix, 'a');
    await fileHandle.close();
  } catch (err) {
    await Promise.reject(err);
  }
}

async function deleteLockFile(filePath) {
  if (!existsSync(filePath + lockFileSuffix)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    unlink(filePath + lockFileSuffix)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}
