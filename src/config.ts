import * as os from 'os';
const args = process.argv.slice(2);

const ctArgValue = parseInt(args.find((value) => value.includes('-ct'))?.split('=')[1] || '')
let concurrentThreads = ctArgValue || os.cpus().length || 2;

export const config = <const> {
  dbFileName: 'db.txt',
  concurrentThreads: concurrentThreads
}
