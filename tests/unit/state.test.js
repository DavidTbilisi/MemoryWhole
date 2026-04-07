import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { shuffle, weightedRandom, updateWeight } from '../../js/pure.js';

describe('shuffle', () => {
  it('returns a new array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });
  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
  it('contains all the same elements', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(shuffle(arr).sort()).toEqual([...arr].sort());
  });
  it('handles empty array', () => expect(shuffle([])).toEqual([]));
  it('handles single element', () => expect(shuffle([42])).toEqual([42]));
});

describe('weightedRandom', () => {
  it('always returns an entry from the pool', () => {
    const pool = [['a', 'Apple'], ['b', 'Banana'], ['c', 'Cherry']];
    for (let i = 0; i < 50; i++) {
      expect(pool).toContainEqual(weightedRandom(pool, {}));
    }
  });
  it('returns the only entry when pool has one item', () => {
    expect(weightedRandom([['x', 'Xray']], {})).toEqual(['x', 'Xray']);
  });
  it('favors high-weight items statistically', () => {
    const pool = [['a', 'A'], ['b', 'B']];
    const weights = { a: 1, b: 100 };
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i++) {
      const [k] = weightedRandom(pool, weights);
      counts[k]++;
    }
    expect(counts.b).toBeGreaterThan(counts.a * 5);
  });
  it('hits fallback return via floating-point boundary (Math.random mocked to 1)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE-754.
    // With r = 1 * total, subtracting 0.1 then 0.2 leaves a tiny positive epsilon
    // so the loop never sees r <= 0 and the fallback line executes.
    vi.spyOn(Math, 'random').mockReturnValueOnce(1);
    const pool = [['a', 'A'], ['b', 'B']];
    const result = weightedRandom(pool, { a: 0.1, b: 0.2 });
    expect(pool).toContainEqual(result);
    vi.restoreAllMocks();
  });
});

describe('updateWeight', () => {
  let weights;
  beforeEach(() => { weights = { a: 4 }; });

  it('doubles weight on wrong answer', () => {
    updateWeight('a', false, 2, weights, []);
    expect(weights.a).toBe(8);
  });
  it('caps weight at 16 on wrong answer', () => {
    weights.a = 10;
    updateWeight('a', false, 2, weights, []);
    expect(weights.a).toBe(16);
  });
  it('reduces weight on correct fast answer', () => {
    updateWeight('a', true, 1, weights, [4, 4, 4]);
    expect(weights.a).toBeCloseTo(4 * 0.7);
  });
  it('applies ×1.3 on correct slow answer', () => {
    updateWeight('a', true, 10, weights, [2, 2, 2]);
    expect(weights.a).toBeCloseTo(4 * 1.3);
  });
  it('floors weight at 1', () => {
    weights.a = 1;
    updateWeight('a', true, 1, weights, [4]);
    expect(weights.a).toBe(1);
  });
  it('initialises unknown keys from 1', () => {
    updateWeight('z', false, 1, weights, []);
    expect(weights.z).toBe(2);
  });
  it('uses fallback sessionAvg of 4 when no times recorded', () => {
    // elapsed=10 > 4*1.5=6 → slow → ×1.3
    updateWeight('a', true, 10, weights, []);
    expect(weights.a).toBeCloseTo(4 * 1.3);
  });
});
