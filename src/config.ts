import * as os from 'os';
import { KVConfig } from './key-value-store.js';

const args = process.argv.slice(2);

const coArgValue = parseInt(args.find((value) => value.includes('-co'))?.split('=')[1] || '')
let concurrentOperations = coArgValue || os.cpus().length || 2;

export const config: KVConfig = {
  dbFileName: 'db.txt',
  concurrentOperations: concurrentOperations,
  useMainThread: false
}
