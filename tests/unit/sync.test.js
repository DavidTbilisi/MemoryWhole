import { describe, it, expect } from 'vitest';
import {
  mergeAllTimeStats,
  mergeDeckStats,
  mergeDrillRecords,
  mergeHistories,
  mergeActivityLog,
} from '../../js/pure.js';

// ── mergeHistories ──────────────────────────────────────────────────────────
describe('mergeHistories', () => {
  it('combines two non-overlapping histories', () => {
    const a = [{ ts: 3, score: 30 }, { ts: 1, score: 10 }];
    const b = [{ ts: 4, score: 40 }, { ts: 2, score: 20 }];
    const result = mergeHistories(a, b);
    expect(result.map(e => e.ts)).toEqual([4, 3, 2, 1]);
  });

  it('deduplicates entries with the same timestamp', () => {
    const a = [{ ts: 100, score: 10 }];
    const b = [{ ts: 100, score: 10 }, { ts: 200, score: 20 }];
    const result = mergeHistories(a, b);
    expect(result).toHaveLength(2);
    expect(result.map(e => e.ts)).toEqual([200, 100]);
  });

  it('caps combined history at 50 entries', () => {
    const a = Array.from({ length: 40 }, (_, i) => ({ ts: i + 100, score: i }));
    const b = Array.from({ length: 40 }, (_, i) => ({ ts: i + 200, score: i }));
    expect(mergeHistories(a, b)).toHaveLength(50);
  });

  it('returns newest-first order', () => {
    const a = [{ ts: 1 }, { ts: 3 }];
    const b = [{ ts: 2 }, { ts: 4 }];
    const result = mergeHistories(a, b);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].ts).toBeGreaterThan(result[i].ts);
    }
  });

  it('handles empty arrays', () => {
    expect(mergeHistories([], [])).toEqual([]);
    expect(mergeHistories([{ ts: 1 }], [])).toEqual([{ ts: 1 }]);
    expect(mergeHistories([], [{ ts: 1 }])).toEqual([{ ts: 1 }]);
  });

  it('does not mutate input arrays', () => {
    const a = [{ ts: 2 }];
    const b = [{ ts: 1 }];
    mergeHistories(a, b);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});

// ── mergeAllTimeStats ───────────────────────────────────────────────────────
describe('mergeAllTimeStats', () => {
  it('keeps local when local has more attempts', () => {
    const local = { major: { totalAttempts: 10, totalCorrect: 8 } };
    const cloud = { major: { totalAttempts: 5,  totalCorrect: 4 } };
    const { merged, needsPush, changed } = mergeAllTimeStats(local, cloud);
    expect(merged.major.totalAttempts).toBe(10);
    expect(needsPush).toBe(true);
    expect(changed).toBe(false);
  });

  it('takes cloud when cloud has more attempts', () => {
    const local = { major: { totalAttempts: 3 } };
    const cloud = { major: { totalAttempts: 9 } };
    const { merged, changed, needsPush } = mergeAllTimeStats(local, cloud);
    expect(merged.major.totalAttempts).toBe(9);
    expect(changed).toBe(true);
    expect(needsPush).toBe(false);
  });

  it('preserves independent deck progress from both sides', () => {
    const local = { major: { totalAttempts: 20 }, sem3: { totalAttempts: 2 } };
    const cloud = { major: { totalAttempts: 5  }, sem3: { totalAttempts: 15 } };
    const { merged, changed, needsPush } = mergeAllTimeStats(local, cloud);
    expect(merged.major.totalAttempts).toBe(20); // local ahead
    expect(merged.sem3.totalAttempts).toBe(15);  // cloud ahead
    expect(changed).toBe(true);
    expect(needsPush).toBe(true);
  });

  it('adds cloud-only deck to merged result', () => {
    const local = {};
    const cloud = { pao: { totalAttempts: 7 } };
    const { merged, changed } = mergeAllTimeStats(local, cloud);
    expect(merged.pao.totalAttempts).toBe(7);
    expect(changed).toBe(true);
  });

  it('sets needsPush for local-only deck', () => {
    const local = { binary: { totalAttempts: 5 } };
    const cloud = {};
    const { needsPush, changed } = mergeAllTimeStats(local, cloud);
    expect(needsPush).toBe(true);
    expect(changed).toBe(false);
  });

  it('handles null/undefined cloud gracefully', () => {
    const local = { major: { totalAttempts: 5 } };
    expect(() => mergeAllTimeStats(local, null)).not.toThrow();
    expect(() => mergeAllTimeStats(local, undefined)).not.toThrow();
  });

  it('does not mutate input objects', () => {
    const local = { major: { totalAttempts: 3 } };
    const cloud = { major: { totalAttempts: 9 } };
    mergeAllTimeStats(local, cloud);
    expect(local.major.totalAttempts).toBe(3);
  });
});

// ── mergeDeckStats ──────────────────────────────────────────────────────────
describe('mergeDeckStats', () => {
  const makeItems = (n) => Object.fromEntries(
    Array.from({ length: n }, (_, i) => [String(i), { attempts: 1, correct: 1, wrong: 0, totalTime: 1 }])
  );

  it('takes cloud deck when cloud has more total attempts', () => {
    const local = { major: makeItems(3) };
    const cloud = { major: makeItems(5) };
    const { merged, changed } = mergeDeckStats(local, cloud);
    expect(Object.keys(merged.major)).toHaveLength(5);
    expect(changed).toBe(true);
  });

  it('keeps local deck when local has more total attempts', () => {
    const local = { major: makeItems(8) };
    const cloud = { major: makeItems(2) };
    const { merged, needsPush, changed } = mergeDeckStats(local, cloud);
    expect(Object.keys(merged.major)).toHaveLength(8);
    expect(needsPush).toBe(true);
    expect(changed).toBe(false);
  });

  it('merges decks independently', () => {
    const local = { major: makeItems(10), sem3: makeItems(2) };
    const cloud = { major: makeItems(3),  sem3: makeItems(8) };
    const { merged } = mergeDeckStats(local, cloud);
    expect(Object.keys(merged.major)).toHaveLength(10);
    expect(Object.keys(merged.sem3)).toHaveLength(8);
  });

  it('handles null cloud', () => {
    const local = { major: makeItems(3) };
    expect(() => mergeDeckStats(local, null)).not.toThrow();
    const { needsPush } = mergeDeckStats(local, null);
    expect(needsPush).toBe(true);
  });

  it('handles cloud-only deck (lItems is undefined)', () => {
    // local has no 'pao' deck → lTotal branch takes the :0 path
    const local = {};
    const cloud = { pao: makeItems(4) };
    const { merged, changed } = mergeDeckStats(local, cloud);
    expect(merged.pao).toBeDefined();
    expect(changed).toBe(true);
  });
});

// ── mergeDrillRecords ───────────────────────────────────────────────────────
describe('mergeDrillRecords', () => {
  const makeRecord = (overrides = {}) => ({
    bestScore: 100, bestAccuracy: 90, bestStreak: 5, mostCorrect: 10,
    totalDrills: 3, totalScore: 300,
    history: [{ ts: 1000, score: 100, correct: 10, wrong: 1, maxStreak: 5 }],
    ...overrides,
  });

  it('takes best values from each side', () => {
    const local = { major: makeRecord({ bestScore: 200, bestAccuracy: 85 }) };
    const cloud = { major: makeRecord({ bestScore: 150, bestAccuracy: 95 }) };
    const { merged } = mergeDrillRecords(local, cloud);
    expect(merged.major.bestScore).toBe(200);    // local wins
    expect(merged.major.bestAccuracy).toBe(95);  // cloud wins
  });

  it('marks changed when cloud has a better best', () => {
    const local = { major: makeRecord({ bestScore: 100 }) };
    const cloud = { major: makeRecord({ bestScore: 999 }) };
    const { changed } = mergeDrillRecords(local, cloud);
    expect(changed).toBe(true);
  });

  it('does not mark changed when local is already best', () => {
    const local = { major: makeRecord({ bestScore: 999 }) };
    const cloud = { major: makeRecord({ bestScore: 100 }) };
    const { changed } = mergeDrillRecords(local, cloud);
    expect(changed).toBe(false);
  });

  it('merges histories from both sides without duplicates', () => {
    const h1 = { ts: 1000, score: 100, correct: 10, wrong: 1, maxStreak: 5 };
    const h2 = { ts: 2000, score: 120, correct: 12, wrong: 0, maxStreak: 7 };
    const local = { major: makeRecord({ history: [h1] }) };
    const cloud = { major: makeRecord({ history: [h1, h2] }) };
    const { merged } = mergeDrillRecords(local, cloud);
    expect(merged.major.history).toHaveLength(2);
    expect(merged.major.history[0].ts).toBe(2000); // newest first
  });

  it('adopts cloud-only deck', () => {
    const local = {};
    const cloud = { major: makeRecord() };
    const { merged, changed } = mergeDrillRecords(local, cloud);
    expect(merged.major).toBeDefined();
    expect(changed).toBe(true);
  });

  it('signals needsPush for local-only deck', () => {
    const local = { major: makeRecord() };
    const cloud = {};
    const { needsPush } = mergeDrillRecords(local, cloud);
    expect(needsPush).toBe(true);
  });

  it('handles null cloud', () => {
    const local = { major: makeRecord() };
    expect(() => mergeDrillRecords(local, null)).not.toThrow();
  });

  it('uses 0 for missing fields when merging two records', () => {
    // Cover || 0 falsy branches for bestAccuracy, totalDrills, totalScore etc.
    const local = { major: { bestAccuracy: 0, totalDrills: 0, history: [] } };
    const cloud = { major: { bestAccuracy: 0, totalDrills: 0, history: [] } };
    const { merged } = mergeDrillRecords(local, cloud);
    expect(merged.major.bestAccuracy).toBe(0);
    expect(merged.major.totalDrills).toBe(0);
  });

  it('covers || [] fallback when history is absent', () => {
    // history undefined on both sides → triggers `|| []` false branches
    const local = { major: { bestScore: 10 } };  // no history field
    const cloud = { major: { bestScore: 20 } };  // no history field
    const { merged } = mergeDrillRecords(local, cloud);
    expect(Array.isArray(merged.major.history)).toBe(true);
  });

  it('handles deck present as undefined in local keys (defensive branch)', () => {
    // Object.keys({x: undefined}) returns ['x'], triggering !l && !c guard
    const local = Object.assign(Object.create(null), { major: undefined });
    const cloud = {};
    expect(() => mergeDrillRecords(local, cloud)).not.toThrow();
  });

  it('does not mutate local input', () => {
    const local = { major: makeRecord({ bestScore: 50 }) };
    const cloud = { major: makeRecord({ bestScore: 999 }) };
    mergeDrillRecords(local, cloud);
    expect(local.major.bestScore).toBe(50);
  });
});

// ── mergeActivityLog ────────────────────────────────────────────────────────
describe('mergeActivityLog', () => {
  it('takes Math.max per counter for shared dates', () => {
    const local = { '2026-04-01': { drills: 3, sessions: 1, attempts: 30 } };
    const cloud = { '2026-04-01': { drills: 1, sessions: 2, attempts: 25 } };
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-01']).toEqual({ drills: 3, sessions: 2, attempts: 30 });
  });

  it('includes local-only dates', () => {
    const local = { '2026-04-02': { drills: 2, sessions: 0, attempts: 20 } };
    const cloud = {};
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-02']).toEqual({ drills: 2, sessions: 0, attempts: 20 });
  });

  it('includes cloud-only dates', () => {
    const local = {};
    const cloud = { '2026-04-03': { drills: 1, sessions: 1, attempts: 10 } };
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-03']).toEqual({ drills: 1, sessions: 1, attempts: 10 });
  });

  it('handles missing counter fields with 0 default', () => {
    const local = { '2026-04-04': { drills: 5 } };          // missing sessions/attempts
    const cloud = { '2026-04-04': { sessions: 3, attempts: 40 } };
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-04'].drills).toBe(5);
    expect(merged['2026-04-04'].sessions).toBe(3);
    expect(merged['2026-04-04'].attempts).toBe(40);
  });

  it('handles null/empty cloud', () => {
    const local = { '2026-04-01': { drills: 1, sessions: 0, attempts: 10 } };
    expect(() => mergeActivityLog(local, null)).not.toThrow();
    expect(() => mergeActivityLog(local, undefined)).not.toThrow();
    const merged = mergeActivityLog(local, null);
    expect(merged['2026-04-01'].drills).toBe(1);
  });

  it('prevents double-counting: same-device sync twice yields max not sum', () => {
    // Simulate device A synced, then syncs again (cloud == local)
    const state = { '2026-04-05': { drills: 2, sessions: 1, attempts: 20 } };
    const merged = mergeActivityLog(state, state);
    expect(merged['2026-04-05']).toEqual({ drills: 2, sessions: 1, attempts: 20 });
  });

  it('does not mutate local input', () => {
    const local = { '2026-04-06': { drills: 3, sessions: 1, attempts: 30 } };
    const cloud = { '2026-04-06': { drills: 5, sessions: 2, attempts: 50 } };
    mergeActivityLog(local, cloud);
    expect(local['2026-04-06'].drills).toBe(3);
  });

  it('handles missing fields on cloud side of a shared date', () => {
    // cloud date has no sessions/attempts → `|| 0` branches take the :0 path
    const local = { '2026-04-07': { drills: 2, sessions: 1, attempts: 20 } };
    const cloud = { '2026-04-07': { drills: 3 } };  // missing sessions + attempts
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-07'].drills).toBe(3);
    expect(merged['2026-04-07'].sessions).toBe(1);
    expect(merged['2026-04-07'].attempts).toBe(20);
  });

  it('covers || 0 fallback when local day.drills is 0', () => {
    // day.drills = 0 → triggers the falsy branch of `day.drills || 0`
    const local = { '2026-04-08': { drills: 0, sessions: 0, attempts: 0 } };
    const cloud = { '2026-04-08': { drills: 2, sessions: 1, attempts: 15 } };
    const merged = mergeActivityLog(local, cloud);
    expect(merged['2026-04-08'].drills).toBe(2);
    expect(merged['2026-04-08'].sessions).toBe(1);
  });
});
