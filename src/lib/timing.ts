export interface TimingAdapter {
  now: () => number;
  wait: (durationMs: number) => Promise<void>;
}

const browserTiming: TimingAdapter = {
  now: () => performance.now(),
  wait: (durationMs) => new Promise((resolve) => window.setTimeout(resolve, durationMs)),
};

export async function waitForMinimumDuration(startedAt: number, minimumDurationMs: number, timing: TimingAdapter = browserTiming) {
  const remainingMs = minimumDurationMs - (timing.now() - startedAt);
  if (remainingMs > 0) await timing.wait(remainingMs);
}

export async function withMinimumDuration<T>(work: () => Promise<T>, minimumDurationMs: number, timing: TimingAdapter = browserTiming) {
  const startedAt = timing.now();

  try {
    return await work();
  } finally {
    await waitForMinimumDuration(startedAt, minimumDurationMs, timing);
  }
}
