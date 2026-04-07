import { describe, it, expect } from 'vitest';
import { getMultiplier } from '../../js/pure.js';

describe('getMultiplier', () => {
  it('returns 1 for streak 0', () => expect(getMultiplier(0)).toBe(1));
  it('returns 1 for streak 1', () => expect(getMultiplier(1)).toBe(1));
  it('returns 1 for streak 2', () => expect(getMultiplier(2)).toBe(1));
  it('returns 2 for streak 3', () => expect(getMultiplier(3)).toBe(2));
  it('returns 2 for streak 5', () => expect(getMultiplier(5)).toBe(2));
  it('returns 3 for streak 6', () => expect(getMultiplier(6)).toBe(3));
  it('returns 3 for streak 8', () => expect(getMultiplier(8)).toBe(3));
  it('returns 4 for streak 9', () => expect(getMultiplier(9)).toBe(4));
  it('returns 4 for streak 20', () => expect(getMultiplier(20)).toBe(4));
});

describe('drill score calculation', () => {
  it('scores 10 pts with ×1 multiplier', () => expect(10 * getMultiplier(1)).toBe(10));
  it('scores 20 pts with ×2 multiplier', () => expect(10 * getMultiplier(3)).toBe(20));
  it('scores 30 pts with ×3 multiplier', () => expect(10 * getMultiplier(6)).toBe(30));
  it('scores 40 pts with ×4 multiplier', () => expect(10 * getMultiplier(9)).toBe(40));

  it('accumulates score correctly over a streak', () => {
    let total = 0;
    let streak = 0;
    for (let i = 0; i < 3; i++) { total += 10 * getMultiplier(streak); streak++; }
    for (let i = 0; i < 3; i++) { total += 10 * getMultiplier(streak); streak++; }
    expect(total).toBe(30 + 60);
  });
});
