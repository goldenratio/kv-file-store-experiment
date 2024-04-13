import { unlink, open } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export async function removeFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    unlink(filePath)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

export async function touchFile(filePath: string): Promise<void> {
  try {
    const fileHandle = await open(filePath, 'a');
    await fileHandle.close();
  } catch (err) {
    await Promise.reject(err);
  }
}

export function noop(): void {
  // do nothing
}
