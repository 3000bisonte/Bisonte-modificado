const { describe, expect, test, afterEach } = require('@jest/globals');

const {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits
} = require('../../src/lib/security');

describe('security rate limiting', () => {
  afterEach(() => {
    clearAllRateLimits();
  });

  test('allows requests within the configured window', async () => {
    const action = 'unit_allow';
    const identifier = 'tester';

    for (let i = 0; i < 3; i += 1) {
      const result = await checkRateLimit(identifier, action, 5, 1_000, { now: i * 100 });
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(i + 1);
    }
  });

  test('blocks once the limit is exceeded and recovers after the window', async () => {
    const action = 'unit_block';
    const identifier = 'tester-block';

    for (let i = 0; i < 3; i += 1) {
      await checkRateLimit(identifier, action, 3, 1_000, { now: i * 100 });
    }

    const blocked = await checkRateLimit(identifier, action, 3, 1_000, { now: 400 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.count).toBeGreaterThanOrEqual(3);
    expect(blocked.resetIn).toBeGreaterThanOrEqual(0);

    const recovered = await checkRateLimit(identifier, action, 3, 1_000, { now: 1_500 });
    expect(recovered.allowed).toBe(true);
    expect(recovered.count).toBe(1);
  });

  test('resetting a rate limit bucket clears previous attempts', async () => {
    const action = 'unit_reset';
    const identifier = 'tester-reset';

    await checkRateLimit(identifier, action, 1, 5_000, { now: 0 });
    const blocked = await checkRateLimit(identifier, action, 1, 5_000, { now: 10 });
    expect(blocked.allowed).toBe(false);

    resetRateLimit(identifier, action);

    const afterReset = await checkRateLimit(identifier, action, 1, 5_000, { now: 20 });
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.count).toBe(1);
  });
});
