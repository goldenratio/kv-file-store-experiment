import { randomInt } from 'node:crypto';

import { KeyValueStore } from './key-value-store.js';
import { config } from './config.js';
import { getRandomCharacter } from "./utils/math-utils.js";

async function main(): Promise<void> {
  await runTest('simulation-with-no-expiry-time-01', 1000);
}

async function runTest(_testName: string, iterations: number, _keyExpiryTimeEnabled: boolean = false): Promise<void> {
  const kv = new KeyValueStore(config);
  await kv.init();
  let keyList = new Set<string>();

  let currentItem = 0;
  const incrementProgress = () => {
    currentItem ++;
    printProgress(`iterations: ${currentItem}/${iterations} - ${Math.round((currentItem / iterations) * 100)}%`);
    if (currentItem === iterations) {
      onComplete();
    }
  };

  const onComplete = () => {
    console.log('\ntest done!');
    console.log([... keyList.values()], keyList.size);
  }

  for (let i = 0; i < iterations; i++) {
    const operationType = randomInt(0, 2);
    const key = getRandomCharacter();

    if (operationType === 0) {
      kv.setValue(key, 99993 + i)
        .then(_success => {
          // console.log(`set key: ${key}, success: ${success}`);
          incrementProgress();
        });
      keyList.add(key);
    } else if (operationType === 1) {
      kv.getValue(key)
        .then(_value => {
          // console.log(`get key: ${key}, value: ${value}`);
          incrementProgress();
        });
    }
  }

}

function printProgress(progress: string){
  // process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(progress);
}

main();
