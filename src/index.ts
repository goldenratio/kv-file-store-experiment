import { KeyValueStore } from './key-value-store.js';
import { config } from './config.js';
import { getRandomCharacter, randomInt } from './utils/math-utils.js';

async function main(): Promise<void> {
  await runTest('simulation-01', 5_000);
  await runTest('simulation-02', 15_000);
  await runTest('simulation-03', 100_000);

  await runTest('simulation-key-expiry-01', 5_000, true);
  await runTest('simulation-key-expiry-02', 15_000, true);
  await runTest('simulation-key-expiry-03', 100_000, true);
}

async function runTest(testName: string, iterations: number, keyExpiryTimeEnabled: boolean = false): Promise<void> {
  return new Promise<void>(async resolve => {
    const startTime = Date.now();
    const kv = new KeyValueStore(config);
    await kv.init();

    let currentItem = 0;
    const incrementProgress = () => {
      currentItem ++;
      const pct = Math.round((currentItem / iterations) * 100);
      printProgress(`testName: ${testName}, keyExpiryTimeEnabled: ${keyExpiryTimeEnabled}, iterations: ${currentItem}/${iterations} - ${pct}% `);
      if (currentItem === iterations) {
        onComplete();
      }
    };

    const onComplete = () => {
      console.log('\nResult: ');
      kv.metrics.prettyPrint();
      kv.dispose();
      console.log(`test (${testName}) finished in ${(Date.now() - startTime) / 1000} seconds\n`);
      resolve();
    }

    for (let i = 0; i < iterations; i++) {
      const operationType = randomInt(0, 1);
      const key = getRandomCharacter();

      if (operationType === 0) {
        const expiryTimeInMs = keyExpiryTimeEnabled ? randomInt(50, 100) : Infinity;
        kv.setValue(key, 99993 + i, expiryTimeInMs)
          .then(_success => {
            // console.log(`set key: ${key}, success: ${success}`);
            incrementProgress();
          });
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
  try {
    process.stdout.cursorTo(0);
    process.stdout.write(progress);
  } catch (err) {
    //
  }
}

await main();
