import * as os from 'os';
import { KVConfig } from './key-value-store.js';
import { toBoolean } from './utils/type-utils.js';

const args = process.argv.slice(2);

const coArgValue = args.find((value) => value.includes('-concurrentOperations'))?.split('=')[1] || '';
const concurrentOperations = parseInt(coArgValue) || os.cpus().length || 2;

const useMainThreadArgValue = args.find((value) => value.includes('-useMainThread'))?.split('=')[1] || 'true'
const useMainThread = toBoolean(useMainThreadArgValue);

export const config: KVConfig = {
  dbFileName: 'db.txt',
  concurrentOperations: concurrentOperations,
  useMainThread: useMainThread
}

