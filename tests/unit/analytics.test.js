import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMastery,
  recordDrillResult,
  getRankTier,
  RANK_TIERS,
  getActivityStreak,
  logActivity,
} from '../../js/pure.js';

// ── calculateMastery ───────────────────────────────────────────────────────
describe('calculateMastery', () => {
  it('returns all zeros for empty array', () => {
    expect(calculateMastery([])).toEqual({ masteredCount: 0, weakCount: 0, needWorkCount: 0, score: 0 });
  });
  it('counts mastered items (>=5 attempts, >=95% accuracy)', () => {
    const items = [
      { attempts: 5,  accuracy: 95 },
      { attempts: 10, accuracy: 100 },
      { attempts: 4,  accuracy: 100 }, // not mastered: < 5 attempts
    ];
    const r = calculateMastery(items);
    expect(r.masteredCount).toBe(2);
    expect(r.needWorkCount).toBe(1);
  });
  it('counts weak items (75–94% accuracy)', () => {
    const items = [{ attempts: 5, accuracy: 80 }, { attempts: 5, accuracy: 94.9 }];
    const r = calculateMastery(items);
    expect(r.weakCount).toBe(2);
    expect(r.masteredCount).toBe(0);
  });
  it('counts needWork items (<75% accuracy)', () => {
    expect(calculateMastery([{ attempts: 5, accuracy: 50 }]).needWorkCount).toBe(1);
  });
  it('computes score correctly (1 mastered + 1 weak out of 2 = 75%)', () => {
    const items = [{ attempts: 5, accuracy: 96 }, { attempts: 5, accuracy: 80 }];
    expect(calculateMastery(items).score).toBe(75);
  });
  it('returns 100% when all items mastered', () => {
    const items = Array.from({ length: 5 }, () => ({ attempts: 5, accuracy: 98 }));
    const r = calculateMastery(items);
    expect(r.score).toBe(100);
    expect(r.masteredCount).toBe(5);
  });
});

// ── recordDrillResult ──────────────────────────────────────────────────────
describe('recordDrillResult', () => {
  let records;
  beforeEach(() => { records = {}; });

  it('initialises deck on first call', () => {
    recordDrillResult(records, 'major', 100, 8, 2, 5);
    expect(records.major).toBeDefined();
    expect(records.major.totalDrills).toBe(1);
  });
  it('returns isNewBest=true on first drill (beats 0)', () => {
    const r = recordDrillResult(records, 'major', 100, 8, 2, 5);
    expect(r.isNewBest).toBe(true);
    expect(r.newRecords).toContain('score');
  });
  it('updates bestScore when new score is higher', () => {
    recordDrillResult(records, 'major', 100, 8, 2, 4);
    recordDrillResult(records, 'major', 200, 15, 1, 8);
    expect(records.major.bestScore).toBe(200);
  });
  it('does NOT update bestScore when lower', () => {
    recordDrillResult(records, 'major', 200, 15, 1, 8);
    const r = recordDrillResult(records, 'major', 50, 3, 5, 2);
    expect(records.major.bestScore).toBe(200);
    expect(r.newRecords).not.toContain('score');
  });
  it('accumulates totalScore', () => {
    recordDrillResult(records, 'major', 100, 8, 2, 5);
    recordDrillResult(records, 'major', 150, 10, 0, 6);
    expect(records.major.totalScore).toBe(250);
  });
  it('prepends to history (newest first)', () => {
    recordDrillResult(records, 'major', 100, 5, 2, 3);
    recordDrillResult(records, 'major', 200, 8, 1, 6);
    expect(records.major.history[0].score).toBe(200);
    expect(records.major.history[1].score).toBe(100);
  });
  it('caps history at 50 entries', () => {
    for (let i = 0; i < 55; i++) recordDrillResult(records, 'major', i * 10, 5, 2, 3);
    expect(records.major.history.length).toBe(50);
  });
  it('computes bestAccuracy correctly', () => {
    recordDrillResult(records, 'major', 100, 9, 1, 5);
    expect(records.major.bestAccuracy).toBe(90.0);
  });
  it('handles zero total (no answers) → accuracy 0', () => {
    recordDrillResult(records, 'major', 0, 0, 0, 0);
    expect(records.major.bestAccuracy).toBe(0);
  });
  it('tracks bestStreak', () => {
    recordDrillResult(records, 'major', 100, 8, 2, 7);
    expect(records.major.bestStreak).toBe(7);
  });
  it('tracks mostCorrect', () => {
    recordDrillResult(records, 'major', 100, 12, 2, 5);
    expect(records.major.mostCorrect).toBe(12);
  });
  it('reports all new record categories', () => {
    const r = recordDrillResult(records, 'major', 100, 8, 2, 5);
    expect(r.newRecords).toEqual(expect.arrayContaining(['score', 'accuracy', 'streak', 'correct']));
  });
  it('isNewBest=false when nothing improves', () => {
    recordDrillResult(records, 'major', 500, 20, 0, 15);
    const r = recordDrillResult(records, 'major', 10,  1,  9, 0);
    expect(r.isNewBest).toBe(false);
  });
});

// ── getRankTier ────────────────────────────────────────────────────────────
describe('getRankTier', () => {
  it.each([
    [0,      'F'],
    [79,     'F'],
    [80,     'E'],
    [249,    'E'],
    [250,    'D'],
    [599,    'D'],
    [600,    'C'],
    [1399,   'C'],
    [1400,   'B'],
    [2999,   'B'],
    [3000,   'A'],
    [5999,   'A'],
    [6000,   'S'],
    [10999,  'S'],
    [11000,  'SS'],
    [19999,  'SS'],
    [20000,  'SSS'],
    [34999,  'SSS'],
    [35000,  'SSS+'],
    [999999, 'SSS+'],
  ])('score %i → rank %s', (score, rank) => {
    expect(getRankTier(score).rank).toBe(rank);
  });

  it('progress is 0% at tier boundary', () => {
    expect(getRankTier(80).progress).toBe(0);
  });
  it('progress is 100% at max rank', () => {
    const r = getRankTier(50000);
    expect(r.progress).toBe(100);
    expect(r.next).toBeNull();
  });
  it('progress increases within tier', () => {
    expect(getRankTier(1000).progress).toBeGreaterThan(getRankTier(600).progress);
  });
  it('exposes next tier', () => {
    expect(getRankTier(0).next?.rank).toBe('E');
  });
  it('next is null at SSS+', () => {
    expect(getRankTier(35000).next).toBeNull();
  });
  it('rankScore is attached to result', () => {
    expect(getRankTier(1234).rankScore).toBe(1234);
  });
  it('covers every tier boundary in RANK_TIERS', () => {
    for (const tier of RANK_TIERS) {
      expect(getRankTier(tier.min).rank).toBe(tier.rank);
    }
  });
});

// ── getActivityStreak ──────────────────────────────────────────────────────
describe('getActivityStreak', () => {
  it('returns 0 for empty log', () => {
    expect(getActivityStreak({}, '2026-04-07')).toBe(0);
  });
  it('returns 1 for only today active', () => {
    expect(getActivityStreak({ '2026-04-07': { drills: 1, sessions: 0 } }, '2026-04-07')).toBe(1);
  });
  it('counts consecutive days', () => {
    const log = {
      '2026-04-07': { drills: 1, sessions: 0 },
      '2026-04-06': { drills: 0, sessions: 1 },
      '2026-04-05': { drills: 2, sessions: 1 },
    };
    expect(getActivityStreak(log, '2026-04-07')).toBe(3);
  });
  it('stops at a gap', () => {
    const log = {
      '2026-04-07': { drills: 1, sessions: 0 },
      '2026-04-05': { drills: 2, sessions: 1 }, // Apr 6 missing
    };
    expect(getActivityStreak(log, '2026-04-07')).toBe(1);
  });
  it('falls back to yesterday if today is empty', () => {
    const log = {
      '2026-04-06': { drills: 1, sessions: 1 },
      '2026-04-05': { drills: 1, sessions: 0 },
    };
    expect(getActivityStreak(log, '2026-04-07')).toBe(2);
  });
  it('returns 0 when today and yesterday are both empty', () => {
    expect(getActivityStreak({ '2026-04-05': { drills: 1, sessions: 0 } }, '2026-04-07')).toBe(0);
  });
});

// ── logActivity ────────────────────────────────────────────────────────────
describe('logActivity', () => {
  it('creates entry for today on first call', () => {
    const log = {};
    logActivity('drill', log, '2026-04-07');
    expect(log['2026-04-07']).toBeDefined();
  });
  it('increments drills count', () => {
    const log = {};
    logActivity('drill', log, '2026-04-07');
    logActivity('drill', log, '2026-04-07');
    expect(log['2026-04-07'].drills).toBe(2);
  });
  it('increments sessions count', () => {
    const log = {};
    logActivity('session', log, '2026-04-07');
    expect(log['2026-04-07'].sessions).toBe(1);
  });
  it('drills and sessions are independent', () => {
    const log = {};
    logActivity('drill', log, '2026-04-07');
    expect(log['2026-04-07'].sessions).toBe(0);
    logActivity('session', log, '2026-04-07');
    expect(log['2026-04-07'].drills).toBe(1);
  });
  it('unknown type does not increment either counter', () => {
    const log = {};
    logActivity('other', log, '2026-04-07');
    expect(log['2026-04-07'].drills).toBe(0);
    expect(log['2026-04-07'].sessions).toBe(0);
  });
});
