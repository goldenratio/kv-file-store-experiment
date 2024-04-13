import * as os from 'os';

export const config = <const> {
  dbFileName: 'db.txt',
  concurrentThreads: os.cpus().length || 2
}
