import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Seed analytics into localStorage before page scripts run */
function seedAnalytics(page, allTimeStats = {}, deckStats = {}) {
  return page.addInitScript(({ at, ds }) => {
    localStorage.setItem('analytics_v1',  JSON.stringify(at));
    localStorage.setItem('deckStats_v1',  JSON.stringify(ds));
  }, { at: allTimeStats, ds: deckStats });
}

/** Read analytics from localStorage after page interactions */
async function readAnalytics(page) {
  return page.evaluate(() => ({
    allTime:   JSON.parse(localStorage.getItem('analytics_v1')  || '{}'),
    deckStats: JSON.parse(localStorage.getItem('deckStats_v1') || '{}'),
  }));
}

/** Mock window.fbSave to capture calls, return recorded args via window.__fbSaveCalls */
function mockFbSave(page) {
  return page.addInitScript(() => {
    window.__fbSaveCalls = [];
    window.fbSave  = (key, obj) => window.__fbSaveCalls.push({ key, obj });
    window.fbUser  = { uid: 'test-user' }; // pretend signed-in
  });
}

// ── loadAnalyticsFromCloud merge strategy ──────────────────────────────────

test.describe('loadAnalyticsFromCloud – merge strategy', () => {

  test('cloud replaces local when cloud has more attempts', async ({ page }) => {
    const localStats = { major: { totalSessions: 1, totalAttempts: 10, totalCorrect: 8, totalWrong: 2 } };
    const cloudStats = { major: { totalSessions: 3, totalAttempts: 30, totalCorrect: 25, totalWrong: 5 } };
    const cloudDeck  = { major: { '0': { correct: 25, wrong: 5, totalTime: 60, attempts: 30 } } };

    await seedAnalytics(page, localStats, {});
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(({ cs, cd }) => {
      window.loadAnalyticsFromCloud(cs, cd);
    }, { cs: cloudStats, cd: cloudDeck });

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalAttempts).toBe(30);
    expect(stored.deckStats.major['0'].attempts).toBe(30);
  });

  test('local is kept and pushed to cloud when local has more attempts', async ({ page }) => {
    const localStats = { major: { totalSessions: 5, totalAttempts: 50, totalCorrect: 40, totalWrong: 10 } };
    const cloudStats = { major: { totalSessions: 1, totalAttempts: 5,  totalCorrect: 4,  totalWrong: 1 } };

    await seedAnalytics(page, localStats, {});
    await page.goto('/', { waitUntil: 'networkidle' });

    // Override fbSave AFTER page load (firebase.js overwrites any addInitScript mock)
    await page.evaluate(() => {
      window.__fbSaveCalls = [];
      window.fbSave  = (key, obj) => window.__fbSaveCalls.push({ key, obj });
      window.fbUser  = { uid: 'test-user' };
      loadAnalytics(); // re-load from seeded localStorage with mock now in place
    });

    await page.evaluate(({ cs }) => {
      window.loadAnalyticsFromCloud(cs, {});
    }, { cs: cloudStats });

    // localStorage must keep local data (not overwritten by cloud)
    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalAttempts).toBe(50);

    // fbSave must have been called to push local data up
    const calls = await page.evaluate(() => window.__fbSaveCalls);
    const keys  = calls.map(c => c.key);
    expect(keys).toContain('analytics');
  });

  test('cloud wins when attempt counts are exactly equal (>= rule)', async ({ page }) => {
    const same = { major: { totalSessions: 2, totalAttempts: 20, totalCorrect: 15, totalWrong: 5 } };

    await seedAnalytics(page, same, {});
    await page.goto('/', { waitUntil: 'networkidle' });

    // Cloud has identical attempt count – cloud should still win
    const cloudDeck = { major: { '0': { correct: 15, wrong: 5, totalTime: 40, attempts: 20 } } };
    await page.evaluate(({ cs, cd }) => {
      window.loadAnalyticsFromCloud(cs, cd);
    }, { cs: same, cd: cloudDeck });

    const stored = await readAnalytics(page);
    expect(stored.deckStats.major['0'].attempts).toBe(20);
  });

  test('null cloud data leaves local state untouched', async ({ page }) => {
    const localStats = { major: { totalSessions: 2, totalAttempts: 20, totalCorrect: 16, totalWrong: 4 } };
    const localDeck  = { major: { '7': { correct: 16, wrong: 4, totalTime: 30, attempts: 20 } } };

    await seedAnalytics(page, localStats, localDeck);
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      window.loadAnalyticsFromCloud(null, null);
    });

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalAttempts).toBe(20);
    expect(stored.deckStats.major['7'].correct).toBe(16);
  });

  test('cloud data loaded when local is empty', async ({ page }) => {
    // No local data
    await page.goto('/', { waitUntil: 'networkidle' });

    const cloudStats = { sem3: { totalSessions: 4, totalAttempts: 40, totalCorrect: 35, totalWrong: 5 } };
    const cloudDeck  = { sem3: { '0100': { correct: 35, wrong: 5, totalTime: 80, attempts: 40 } } };

    await page.evaluate(({ cs, cd }) => {
      window.loadAnalyticsFromCloud(cs, cd);
    }, { cs: cloudStats, cd: cloudDeck });

    const stored = await readAnalytics(page);
    expect(stored.allTime.sem3.totalAttempts).toBe(40);
    expect(stored.deckStats.sem3['0100'].correct).toBe(35);
  });

  test('deckStats cloud data is used when cloud has more attempts', async ({ page }) => {
    const localStats = { major: { totalSessions: 1, totalAttempts: 5,  totalCorrect: 4, totalWrong: 1 } };
    const localDeck  = { major: { '3': { correct: 4, wrong: 1, totalTime: 10, attempts: 5 } } };
    const cloudStats = { major: { totalSessions: 3, totalAttempts: 30, totalCorrect: 28, totalWrong: 2 } };
    const cloudDeck  = { major: { '3': { correct: 28, wrong: 2, totalTime: 60, attempts: 30 } } };

    await seedAnalytics(page, localStats, localDeck);
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(({ cs, cd }) => {
      window.loadAnalyticsFromCloud(cs, cd);
    }, { cs: cloudStats, cd: cloudDeck });

    const stored = await readAnalytics(page);
    expect(stored.deckStats.major['3'].attempts).toBe(30);
    expect(stored.deckStats.major['3'].correct).toBe(28);
  });

  test('multi-deck total is compared, not per-deck', async ({ page }) => {
    // Local has 100 attempts across two decks (major=60, sem3=40)
    // Cloud has 80 attempts in just one deck (major=80)
    // Cloud total (80) < local total (100) → local wins
    const localStats = {
      major: { totalSessions: 6, totalAttempts: 60, totalCorrect: 50, totalWrong: 10 },
      sem3:  { totalSessions: 4, totalAttempts: 40, totalCorrect: 32, totalWrong: 8  },
    };
    const cloudStats = {
      major: { totalSessions: 8, totalAttempts: 80, totalCorrect: 75, totalWrong: 5 },
    };

    await seedAnalytics(page, localStats, {});
    await page.goto('/', { waitUntil: 'networkidle' });

    // Override fbSave AFTER page load (firebase.js overwrites any addInitScript mock)
    await page.evaluate(() => {
      window.__fbSaveCalls = [];
      window.fbSave  = (key, obj) => window.__fbSaveCalls.push({ key, obj });
      window.fbUser  = { uid: 'test-user' };
      loadAnalytics(); // re-load from seeded localStorage with mock now in place
    });

    await page.evaluate(({ cs }) => {
      window.loadAnalyticsFromCloud(cs, {});
    }, { cs: cloudStats });

    // Local wins (100 > 80): localStorage should still reflect local
    const stored = await readAnalytics(page);
    expect(stored.allTime.sem3.totalAttempts).toBe(40);

    // And fbSave should have pushed local data
    const calls = await page.evaluate(() => window.__fbSaveCalls);
    expect(calls.some(c => c.key === 'analytics')).toBe(true);
  });
});

// ── recordSessionStats accumulation ───────────────────────────────────────

test.describe('recordSessionStats – accumulation', () => {

  test('first session creates deck entry in allTimeStats', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      // Clear any existing analytics
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '5': { correct: 3, wrong: 1, totalTime: 8, attempts: 4 },
      });
    });

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalSessions).toBe(1);
    expect(stored.allTime.major.totalAttempts).toBe(4);
    expect(stored.allTime.major.totalCorrect).toBe(3);
    expect(stored.allTime.major.totalWrong).toBe(1);
  });

  test('second session accumulates on top of first', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '5': { correct: 3, wrong: 1, totalTime: 8, attempts: 4 },
      });
      recordSessionStats('major', {
        '5': { correct: 4, wrong: 0, totalTime: 6, attempts: 4 },
      });
    });

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalSessions).toBe(2);
    expect(stored.allTime.major.totalAttempts).toBe(8);
    expect(stored.allTime.major.totalCorrect).toBe(7);
    expect(stored.allTime.major.totalWrong).toBe(1);
  });

  test('per-item deckStats are accumulated across sessions', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '0': { correct: 2, wrong: 1, totalTime: 5, attempts: 3 },
      });
      recordSessionStats('major', {
        '0': { correct: 3, wrong: 0, totalTime: 4, attempts: 3 },
      });
    });

    const stored = await readAnalytics(page);
    expect(stored.deckStats.major['0'].correct).toBe(5);
    expect(stored.deckStats.major['0'].wrong).toBe(1);
    expect(stored.deckStats.major['0'].attempts).toBe(6);
    expect(stored.deckStats.major['0'].totalTime).toBe(9);
  });

  test('session with multiple items updates each item independently', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '0': { correct: 5, wrong: 0, totalTime: 10, attempts: 5 },
        '1': { correct: 3, wrong: 2, totalTime: 12, attempts: 5 },
        '2': { correct: 1, wrong: 4, totalTime: 15, attempts: 5 },
      });
    });

    const stored = await readAnalytics(page);
    expect(stored.deckStats.major['0'].correct).toBe(5);
    expect(stored.deckStats.major['1'].correct).toBe(3);
    expect(stored.deckStats.major['2'].correct).toBe(1);
    expect(stored.allTime.major.totalAttempts).toBe(15);
    expect(stored.allTime.major.totalCorrect).toBe(9);
    expect(stored.allTime.major.totalWrong).toBe(6);
  });

  test('stats are persisted to localStorage after recording', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('sem3', {
        '0100': { correct: 7, wrong: 3, totalTime: 20, attempts: 10 },
      });
    });

    // Read directly from localStorage (not via module vars)
    const stored = await readAnalytics(page);
    expect(stored.allTime.sem3).toBeTruthy();
    expect(stored.deckStats.sem3['0100'].attempts).toBe(10);
  });

  test('multiple decks accumulate independently', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', { '1': { correct: 5, wrong: 0, totalTime: 10, attempts: 5 } });
      recordSessionStats('sem3',  { '0100': { correct: 3, wrong: 2, totalTime: 8,  attempts: 5 } });
    });

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalAttempts).toBe(5);
    expect(stored.allTime.sem3.totalAttempts).toBe(5);
    expect(stored.deckStats.major['1'].correct).toBe(5);
    expect(stored.deckStats.sem3['0100'].wrong).toBe(2);
  });
});

// ── calculateMastery classification ───────────────────────────────────────

test.describe('calculateMastery – classification', () => {

  test('item with 5+ attempts and 95%+ accuracy is Mastered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '0', attempts: 10, accuracy: '100.0' }];
      return calculateMastery(items);
    });

    expect(result.masteredCount).toBe(1);
    expect(result.weakCount).toBe(0);
    expect(result.needWorkCount).toBe(0);
  });

  test('item with 5+ attempts and 75–94% accuracy is In Progress', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '1', attempts: 8, accuracy: '87.5' }];
      return calculateMastery(items);
    });

    expect(result.masteredCount).toBe(0);
    expect(result.weakCount).toBe(1);
    expect(result.needWorkCount).toBe(0);
  });

  test('item with <75% accuracy needs work regardless of attempt count', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '2', attempts: 20, accuracy: '50.0' }];
      return calculateMastery(items);
    });

    expect(result.needWorkCount).toBe(1);
    expect(result.masteredCount).toBe(0);
  });

  test('item with <5 attempts needs work even if accuracy is 100%', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '3', attempts: 2, accuracy: '100.0' }];
      return calculateMastery(items);
    });

    expect(result.needWorkCount).toBe(1);
    expect(result.masteredCount).toBe(0);
  });

  test('mastery score is 100% when all items are mastered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [
        { num: '0', attempts: 10, accuracy: '100.0' },
        { num: '1', attempts: 10, accuracy: '95.0'  },
      ];
      return calculateMastery(items);
    });

    expect(result.score).toBe(100);
  });

  test('mastery score is 50% when half mastered, half need work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [
        { num: '0', attempts: 10, accuracy: '100.0' }, // mastered  → 10 pts
        { num: '1', attempts: 10, accuracy: '30.0'  }, // need work → 0 pts
      ];
      return calculateMastery(items);
    });

    // 10 / 20 = 50%
    expect(result.score).toBe(50);
  });

  test('empty items list returns zero score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => calculateMastery([]));

    expect(result.score).toBe(0);
    expect(result.masteredCount).toBe(0);
  });

  test('item at exactly 95% accuracy with 5 attempts is mastered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '4', attempts: 5, accuracy: '95.0' }];
      return calculateMastery(items);
    });

    expect(result.masteredCount).toBe(1);
  });

  test('item at exactly 75% accuracy is In Progress not Need Work', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const items = [{ num: '5', attempts: 10, accuracy: '75.0' }];
      return calculateMastery(items);
    });

    expect(result.weakCount).toBe(1);
    expect(result.needWorkCount).toBe(0);
  });
});

// ── Global stats bar ───────────────────────────────────────────────────────

test.describe('Global stats bar – display', () => {

  test('stats bar shows correct attempt count after recording sessions', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '1': { correct: 8, wrong: 2, totalTime: 20, attempts: 10 },
        '2': { correct: 7, wrong: 3, totalTime: 18, attempts: 10 },
      });

      refreshGlobalStats();
    });

    const attempts = await page.locator('#gs-attempts').textContent();
    expect(parseInt(attempts)).toBe(20);
  });

  test('stats bar shows correct accuracy percentage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', {
        '1': { correct: 8, wrong: 2, totalTime: 20, attempts: 10 },
      });

      refreshGlobalStats();
    });

    const acc = await page.locator('#gs-acc').textContent();
    expect(acc).toBe('80.0%');
  });

  test('stats bar shows 0 knowledge points when nothing is mastered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();
      refreshGlobalStats();
    });

    const kp = await page.locator('#gs-kp').textContent();
    expect(parseInt(kp)).toBe(0);
  });

  test('knowledge point counted once item reaches 5 attempts at 95%+', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      // Inject 5 correct answers for item '0' in major directly into deckStats
      recordSessionStats('major', {
        '0': { correct: 5, wrong: 0, totalTime: 10, attempts: 5 },
      });

      refreshGlobalStats();
    });

    const kp = await page.locator('#gs-kp').textContent();
    expect(parseInt(kp)).toBeGreaterThanOrEqual(1);
  });

  test('session count increments per session', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();

      recordSessionStats('major', { '1': { correct: 1, wrong: 0, totalTime: 2, attempts: 1 } });
      recordSessionStats('major', { '2': { correct: 1, wrong: 0, totalTime: 2, attempts: 1 } });
      recordSessionStats('sem3',  { '0100': { correct: 1, wrong: 0, totalTime: 2, attempts: 1 } });

      refreshGlobalStats();
    });

    const sessions = await page.locator('#gs-sessions').textContent();
    expect(parseInt(sessions)).toBe(3);
  });
});

// ── End-to-end: quiz session → analytics recorded ─────────────────────────

test.describe('Analytics – end-to-end via quiz', () => {

  test('completing a quiz session records stats in localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Clear analytics
    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();
    });

    // Run a quiz and answer one question
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Finish")').click();
    await page.waitForTimeout(500);

    const stored = await readAnalytics(page);
    const majorStats = stored.allTime.major;
    expect(majorStats).toBeTruthy();
    expect(majorStats.totalSessions).toBeGreaterThanOrEqual(1);
    expect(majorStats.totalAttempts).toBeGreaterThanOrEqual(1);
  });

  test('correct answer increments totalCorrect in analytics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();
    });

    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Finish")').click();
    await page.waitForTimeout(500);

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalCorrect).toBeGreaterThanOrEqual(1);
    expect(stored.allTime.major.totalWrong).toBe(0);
  });

  test('wrong answer increments totalWrong in analytics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();
    });

    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (text.trim() !== correctAnswer) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Finish")').click();
    await page.waitForTimeout(500);

    // A wrong answer triggers replay — answer the replay question to reach stats
    const replayVisible = await page.locator('#replay-banner').isVisible().catch(() => false);
    if (replayVisible) {
      const replayAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: replayAnswer }).first().click();
      await page.waitForTimeout(1500);
    }

    const stored = await readAnalytics(page);
    expect(stored.allTime.major.totalWrong).toBeGreaterThanOrEqual(1);
  });

  test('global stats bar updates after quiz session completes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.removeItem('analytics_v1');
      localStorage.removeItem('deckStats_v1');
      loadAnalytics();
      refreshGlobalStats();
    });

    const attemptsBefore = await page.locator('#gs-attempts').textContent();

    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Finish")').click();
    await page.waitForTimeout(500);

    const attemptsAfter = await page.locator('#gs-attempts').textContent();
    expect(parseInt(attemptsAfter)).toBeGreaterThan(parseInt(attemptsBefore));
  });
});
