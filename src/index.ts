import { randomInt } from 'node:crypto';

import { KeyValueStore } from './key-value-store.js';
import { config } from './config.js';
import { getRandomCharacter } from './utils/math-utils.js';
import { MetricData } from './utils/metrics.js';

let metricsReportMap = new Map<string, ReadonlyArray<MetricData>>();

async function main(): Promise<void> {
  await runTest('simulation-01', 100);
  // await runTest('simulation-02', 200);
}

async function runTest(testName: string, iterations: number, keyExpiryTimeEnabled: boolean = false): Promise<void> {
  return new Promise<void>(async resolve => {
    const kv = new KeyValueStore(config);
    await kv.init();
    let keyList = new Set<string>();

    let currentItem = 0;
    const incrementProgress = () => {
      currentItem ++;
      printProgress(`testName: ${testName}, iterations: ${currentItem}/${iterations} - ${Math.round((currentItem / iterations) * 100)}% `);
      if (currentItem === iterations) {
        onComplete();
      }
    };

    const onComplete = () => {
      console.log('\ntest done!\n');
      console.log([... keyList.values()], keyList.size);
      metricsReportMap.set(testName, kv.getMetricsLog());
      resolve();
    }

    for (let i = 0; i < iterations; i++) {
      const operationType = randomInt(0, 2);
      const key = getRandomCharacter();

      if (operationType === 0) {
        const expiryTimeInMs = keyExpiryTimeEnabled ? randomInt(0, 101) : Infinity;
        kv.setValue(key, 99993 + i, expiryTimeInMs)
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
  });
}

function printProgress(progress: string){
  // process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(progress);
}

main();
