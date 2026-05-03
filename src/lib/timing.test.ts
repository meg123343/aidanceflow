import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { withMinimumDuration } from './timing.ts';

describe('withMinimumDuration', () => {
  test('waits for the remaining time when work finishes quickly', async () => {
    let now = 0;
    const waits: number[] = [];

    const result = await withMinimumDuration(
      async () => {
        now = 420;
        return 'ready';
      },
      3000,
      {
        now: () => now,
        wait: async (durationMs) => {
          waits.push(durationMs);
          now += durationMs;
        },
      },
    );

    assert.equal(result, 'ready');
    assert.deepEqual(waits, [2580]);
  });

  test('does not wait when work already exceeds the minimum time', async () => {
    let now = 0;
    const waits: number[] = [];

    const result = await withMinimumDuration(
      async () => {
        now = 3200;
        return 'ready';
      },
      3000,
      {
        now: () => now,
        wait: async (durationMs) => {
          waits.push(durationMs);
        },
      },
    );

    assert.equal(result, 'ready');
    assert.deepEqual(waits, []);
  });

  test('still preserves the minimum time when work fails', async () => {
    let now = 0;
    const waits: number[] = [];

    await assert.rejects(
      withMinimumDuration(
        async () => {
          now = 1000;
          throw new Error('generation failed');
        },
        3000,
        {
          now: () => now,
          wait: async (durationMs) => {
            waits.push(durationMs);
            now += durationMs;
          },
        },
      ),
      /generation failed/,
    );

    assert.deepEqual(waits, [2000]);
  });
});
