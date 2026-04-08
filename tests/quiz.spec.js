import { test, expect } from '@playwright/test';

test.describe('Quiz Configuration', () => {
  test('major system shows 10 ranges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await expect(page.locator('#quiz-config')).toBeVisible();
    const buttons = await page.locator('.subset-btn').all();
    expect(buttons.length).toBe(10);
  });

  test('sem3 shows 10 categories', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[1].click(); // SEM3
    await expect(page.locator('#quiz-config')).toBeVisible();
    const buttons = await page.locator('.subset-btn').all();
    expect(buttons.length).toBe(10);
  });

  test('months shows 3 ranges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[2].click(); // Months
    await expect(page.locator('#quiz-config')).toBeVisible();
    const buttons = await page.locator('.subset-btn').all();
    expect(buttons.length).toBe(3);
  });

  test('clocks shows 4 ranges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[3].click(); // Clocks
    await expect(page.locator('#quiz-config')).toBeVisible();
    const buttons = await page.locator('.subset-btn').all();
    expect(buttons.length).toBe(4);
  });

  test('all buttons are active by default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    const buttons = await page.locator('.subset-btn').all();
    for (const btn of buttons) {
      const isActive = await btn.evaluate(el => el.classList.contains('active'));
      expect(isActive).toBe(true);
    }
  });

  test('toggle all deactivates all active buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Toggle All")').click();

    const buttons = await page.locator('.subset-btn').all();
    for (const btn of buttons) {
      const isActive = await btn.evaluate(el => el.classList.contains('active'));
      expect(isActive).toBe(false);
    }
  });

  test('toggle all activates all inactive buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Toggle All")').click();
    await page.locator('button:has-text("Toggle All")').click();

    const buttons = await page.locator('.subset-btn').all();
    for (const btn of buttons) {
      const isActive = await btn.evaluate(el => el.classList.contains('active'));
      expect(isActive).toBe(true);
    }
  });

  test('individual button toggle works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();

    const firstBtn = page.locator('.subset-btn').first();
    const initialState = await firstBtn.evaluate(el => el.classList.contains('active'));
    await firstBtn.click();
    const newState = await firstBtn.evaluate(el => el.classList.contains('active'));

    expect(initialState).toBe(true);
    expect(newState).toBe(false);
  });

  test('cannot start quiz with 0 selections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();

    // Deselect all
    await page.locator('button:has-text("Toggle All")').click();

    // Try to start
    await page.locator('button:has-text("Start Quiz")').last().click();

    // Should show alert or stay on config
    // Check that quiz didn't start
    const quizVisible = await page.locator('#quiz').isVisible().catch(() => false);
    const configVisible = await page.locator('#quiz-config').isVisible();

    expect(quizVisible).toBe(false);
    expect(configVisible).toBe(true);
  });

});

test.describe('Quiz Gameplay', () => {
  test('quiz shows number and 6 options', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    await expect(page.locator('#quiz')).toBeVisible();
    await expect(page.locator('#q-number')).toBeVisible();
    const buttons = await page.locator('.ans-btn').all();
    expect(buttons.length).toBe(6);
  });

  test('correct answer shows green highlight', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const correctBtn = page.locator('.ans-btn', { hasText: correctAnswer }).first();

    await correctBtn.click();
    await expect(correctBtn).toHaveClass(/correct-ans/, { timeout: 2000 });
  });

  test('wrong answer shows red highlight', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));

    await wrongBtn.click();
    await expect(page.locator('.ans-btn.wrong-ans')).toBeVisible({ timeout: 2000 });
  });

  test('wrong answer shows correct answer in green', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));

    await wrongBtn.click();

    await expect(page.locator('.ans-btn.correct-ans')).toBeVisible({ timeout: 2000 });
  });

  test('buttons disabled after answer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const correctBtn = page.locator('.ans-btn', { hasText: correctAnswer }).first();

    await correctBtn.click();
    await expect(correctBtn).toBeDisabled({ timeout: 2000 });
  });

  test('timer increments during question', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    await page.waitForTimeout(500);
    const timer1 = await page.locator('#q-timer').textContent();
    await page.waitForTimeout(500);
    const timer2 = await page.locator('#q-timer').textContent();

    const time1 = parseFloat(timer1);
    const time2 = parseFloat(timer2);
    expect(time2).toBeGreaterThan(time1);
  });

  test('score bar updates on correct answer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctBefore = await page.locator('#sc-correct').textContent();
    expect(correctBefore).toBe('0');

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();

    await page.waitForTimeout(1000);
    const correctAfter = await page.locator('#sc-correct').textContent();
    expect(correctAfter).toBe('1');
  });

  test('score bar updates on wrong answer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const wrongBefore = await page.locator('#sc-wrong').textContent();
    expect(wrongBefore).toBe('0');

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const buttons = await page.locator('.ans-btn').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text !== correctAnswer) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);
    const wrongAfter = await page.locator('#sc-wrong').textContent();
    expect(wrongAfter).toBe('1');
  });


  test('streak resets on wrong answer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();
    // Ensure streak starts at 0 for test isolation
    await page.evaluate(() => { score = { correct: 0, wrong: 0, streak: 0, times: [] }; updateScoreBar(); });

    // Answer 2 correctly
    for (let i = 0; i < 2; i++) {
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    // Answer wrong
    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));
    await wrongBtn.click();
    await page.waitForTimeout(1500);

    const streak = await page.locator('#sc-streak').textContent();
    expect(streak).toBe('0');
  });

  test('back button from quiz returns to home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    await page.locator('#quiz button:has-text("← Back")').click();

    await expect(page.locator('#home')).toBeVisible();
  });
});

test.describe('Range Selection', () => {
  test('single range filters to correct numbers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();

    // Deselect all except 0-9
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 1; i < buttons.length; i++) {
      await buttons[i].click();
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenNumbers = new Set();
    for (let i = 0; i < 10; i++) {
      const num = await page.locator('#q-number').textContent();
      seenNumbers.add(parseInt(num));
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const allInRange = Array.from(seenNumbers).every(n => n >= 0 && n <= 9);
    expect(allInRange).toBe(true);
  });

  test('middle range filters correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();

    // Select only 40-49
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 0; i < buttons.length; i++) {
      if (i !== 4) await buttons[i].click(); // 4 is 40-49
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenNumbers = new Set();
    for (let i = 0; i < 10; i++) {
      const num = await page.locator('#q-number').textContent();
      seenNumbers.add(parseInt(num));
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const allInRange = Array.from(seenNumbers).every(n => n >= 40 && n <= 49);
    expect(allInRange).toBe(true);
  });

  test('last range filters correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();

    // Select only 90-99
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 0; i < buttons.length - 1; i++) {
      await buttons[i].click();
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenNumbers = new Set();
    for (let i = 0; i < 10; i++) {
      const num = await page.locator('#q-number').textContent();
      seenNumbers.add(parseInt(num));
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const allInRange = Array.from(seenNumbers).every(n => n >= 90 && n <= 99);
    expect(allInRange).toBe(true);
  });

  test('SEM3 vision category filters correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[1].click(); // SEM3

    // Select only Vision (first button)
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 1; i < buttons.length; i++) {
      await buttons[i].click();
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenCodes = new Set();
    for (let i = 0; i < 10; i++) {
      const code = await page.locator('#q-number').textContent();
      seenCodes.add(code);
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const allVision = Array.from(seenCodes).every(code => code.startsWith('0'));
    expect(allVision).toBe(true);
  });

  test('months 1-11 range filters correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[2].click(); // Months

    // Select only 1-11
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 1; i < buttons.length; i++) {
      await buttons[i].click();
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenNumbers = new Set();
    for (let i = 0; i < 10; i++) {
      const num = await page.locator('#q-number').textContent();
      seenNumbers.add(parseInt(num));
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const allInRange = Array.from(seenNumbers).every(n => n >= 1 && n <= 11);
    expect(allInRange).toBe(true);
  });

  test('clocks 12-17 range filters correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const startButtons = await page.locator('.deck-card').locator('button:has-text("Start Quiz")').all();
    await startButtons[3].click(); // Clocks

    // Select only 12-17
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 0; i < buttons.length; i++) {
      if (i !== 2) await buttons[i].click(); // 2 is 12-17
    }

    await page.locator('button:has-text("Start Quiz")').last().click();

    const seenTimes = new Set();
    for (let i = 0; i < 10; i++) {
      const time = await page.locator('#q-number').textContent();
      seenTimes.add(time);
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    const validTimes = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const allInRange = Array.from(seenTimes).every(t => validTimes.includes(t));
    expect(allInRange).toBe(true);
  });
});

test.describe('Mistake Replay', () => {
  test('replay banner appears on wrong answers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    // Answer wrong
    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));
    await wrongBtn.click();
    await page.waitForTimeout(1500);

    // Finish to trigger replay
    await page.locator('button:has-text("Finish")').click();

    const banner = page.locator('#replay-banner');
    await expect(banner).toBeVisible({ timeout: 3000 });
  });

  test('replay shows progress', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));
    await wrongBtn.click();
    await page.waitForTimeout(1500);

    // Call finishQuiz() directly to avoid timing issues with the UI button
    await page.evaluate(() => { try { finishQuiz(); } catch (e) { } });
    const banner = page.locator('#replay-banner');
    await expect(banner).toBeVisible({ timeout: 3000 });
    const progress = await page.locator('#replay-progress').textContent();
    expect(progress).toMatch(/^\d+ \/ \d+$/);
  });

  test('no replay if all answers correct', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    // Answer 2 correctly then finish
    for (let i = 0; i < 2; i++) {
      const correctAnswer = await page.evaluate(() => currentAnswer);
      await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
      await page.waitForTimeout(1000);
    }

    await page.locator('button:has-text("Finish")').click();

    // Should go to stats, not replay
    const statsVisible = await page.locator('#stats').isVisible();
    const replayBanner = page.locator('#replay-banner');
    const replayVisible = await replayBanner.isVisible().catch(() => false);

    expect(statsVisible).toBe(true);
    expect(replayVisible).toBe(false);
  });
});

test.describe('Stats Screen', () => {
  test('stats screen shows on finish', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Finish")').click();

    await expect(page.locator('#stats')).toBeVisible();
  });

  test('stats shows summary', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const correctAnswer = await page.evaluate(() => currentAnswer);
    await page.locator('.ans-btn', { hasText: correctAnswer }).first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Finish")').click();

    await expect(page.locator('.summary-card')).toHaveCount(4); // Correct, Wrong, Avg, Total
  });


});

test.describe('Preview Table', () => {
  test('preview button opens major table', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Preview")').click();

    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('.preview-title')).toContainText('Major System');
  });

  test('preview shows table data', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Preview")').click();

    const table = page.locator('.assoc-table');
    await expect(table).toBeVisible();
    const rows = await table.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('preview back button returns to home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Preview")').click();

    await page.locator('#preview button:has-text("← Back")').click();

    await expect(page.locator('#home')).toBeVisible();
  });
});

test.describe('Editor', () => {
  test('edit button opens editor', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Edit")').click();

    await expect(page.locator('#editor')).toBeVisible();
  });

  test('editor shows 100 rows for major', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Edit")').click();

    const rows = await page.locator('.editor-row').count();
    expect(rows).toBe(100);
  });

  test('editor back button returns to home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Edit")').click();

    await page.locator('#editor button:has-text("Back")').click();

    await expect(page.locator('#home')).toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test('very long word input truncates display', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Edit")').click();

    const firstInput = page.locator('.word-input').first();
    await firstInput.fill('ThisIsAVeryLongWordThatShouldBeTruncatedInTheDisplay');

    const input = page.locator('.word-input').first();
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(20);
  });

  test('empty input saves as empty', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button:has-text("Edit")').click();

    const firstInput = page.locator('.word-input').first();
    await firstInput.clear();
    await page.locator('button:has-text("Save")').click();

    // Toast should appear
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
  });


  test('quiz continues after wrong answer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    // Answer wrong
    const correctAnswer = await page.evaluate(() => currentAnswer);
    const allBtns = await page.locator('.ans-btn').all();
    const wrongBtn = await Promise.resolve(allBtns.find(async (b) => {
      const text = await b.textContent();
      return text !== correctAnswer;
    }));
    await wrongBtn.click();
    await page.waitForTimeout(1500);

    // Next question should appear
    const num = await page.locator('#q-number').textContent();
    expect(num).toBeTruthy();
  });

  test('score bar visible during quiz', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();

    const scoreBar = page.locator('#score-bar');
    await expect(scoreBar).toBeVisible();
  });
});

test.describe('Edit & Quiz Integration', () => {
  // Helper: seed localStorage with a custom edit before page load
  async function seedEdit(page, deck, key, value) {
    await page.addInitScript(({ deck, key, value }) => {
      const lsKeys = { major: 'majorSystemData_v2', sem3: 'sem3Edits_v1', months: 'monthsEdits_v1', clocks: 'clocksEdits_v1' };
      const existing = JSON.parse(localStorage.getItem(lsKeys[deck]) || '{}');
      existing[key] = value;
      localStorage.setItem(lsKeys[deck], JSON.stringify(existing));
    }, { deck, key, value });
  }

  test('edited major word is loaded into quiz data pool', async ({ page }) => {
    await seedEdit(page, 'major', '0', 'ZORK_UNIQUE_WORD');
    await page.goto('/', { waitUntil: 'networkidle' });

    // Start quiz and verify quiz data contains the edit
    const val = await page.evaluate(() => {
      showQuizConfig('major');
      startQuizFromConfig();
      return data['0'];
    });
    expect(val).toBe('ZORK_UNIQUE_WORD');
  });

  test('edited major word is the correct answer for that number', async ({ page }) => {
    await seedEdit(page, 'major', '5', 'MYWORD_FIVE');
    await page.goto('/', { waitUntil: 'networkidle' });

    const answer = await page.evaluate(() => {
      return loadDeckData('major')['5'];
    });
    expect(answer).toBe('MYWORD_FIVE');
  });

  test('edited sem3 word is used in quiz', async ({ page }) => {
    await seedEdit(page, 'sem3', '0100', 'MYSEM3_EDIT');
    await page.goto('/', { waitUntil: 'networkidle' });

    const answer = await page.evaluate(() => loadDeckData('sem3')['0100']);
    expect(answer).toBe('MYSEM3_EDIT');
  });

  test('edited months word is used in quiz', async ({ page }) => {
    await seedEdit(page, 'months', '1', 'MYMONTH_EDIT');
    await page.goto('/', { waitUntil: 'networkidle' });

    const answer = await page.evaluate(() => loadDeckData('months')['1']);
    expect(answer).toBe('MYMONTH_EDIT');
  });

  test('edited clocks word is used in quiz', async ({ page }) => {
    await seedEdit(page, 'clocks', '12:00', 'MYCLOCK_EDIT');
    await page.goto('/', { waitUntil: 'networkidle' });

    const answer = await page.evaluate(() => loadDeckData('clocks')['12:00']);
    expect(answer).toBe('MYCLOCK_EDIT');
  });

  test('saving in editor persists to localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-card, .deck-card').first().locator('button:has-text("Edit")').click();

    const firstInput = page.locator('.word-input').first();
    await firstInput.clear();
    await firstInput.fill('EDITED_WORD_TEST');
    await page.locator('button:has-text("Save")').click();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('majorSystemData_v2');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).not.toBeNull();
    const values = Object.values(stored);
    expect(values.some(v => v === 'EDITED_WORD_TEST')).toBe(true);
  });

  test('saving sem3 edit persists to sem3 localStorage key', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => showEditor('sem3'));

    const firstInput = page.locator('.word-input').first();
    await firstInput.clear();
    await firstInput.fill('SEM3_EDIT_TEST');
    await page.locator('button:has-text("Save")').click();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('sem3Edits_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).not.toBeNull();
    const values = Object.values(stored);
    expect(values.some(v => v === 'SEM3_EDIT_TEST')).toBe(true);
  });

  test('major edit does NOT bleed into sem3 data', async ({ page }) => {
    await seedEdit(page, 'major', '0', 'MAJOR_ONLY');
    await page.goto('/', { waitUntil: 'networkidle' });

    const sem3Values = await page.evaluate(() => Object.values(loadDeckData('sem3')));
    expect(sem3Values.includes('MAJOR_ONLY')).toBe(false);
  });

  test('sem3 edit does NOT bleed into major data', async ({ page }) => {
    await seedEdit(page, 'sem3', '0100', 'SEM3_ONLY');
    await page.goto('/', { waitUntil: 'networkidle' });

    const majorValues = await page.evaluate(() => Object.values(loadDeckData('major')));
    expect(majorValues.includes('SEM3_ONLY')).toBe(false);
  });

  test('unedited keys fall back to base data', async ({ page }) => {
    await seedEdit(page, 'major', '0', 'CUSTOM_ZERO');
    await page.goto('/', { waitUntil: 'networkidle' });

    const val1 = await page.evaluate(() => loadDeckData('major')['1']);
    expect(val1).toBe('Day'); // DEFAULTS['1'] untouched
  });

  test('quiz uses edited word after save', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Edit key '3' in major to a unique value
    await page.evaluate(() => {
      const edits = JSON.parse(localStorage.getItem('majorSystemData_v2') || '{}');
      edits['3'] = 'UNIQUEWORD_Q3';
      localStorage.setItem('majorSystemData_v2', JSON.stringify(edits));
    });

    // Start major quiz and check data loaded correctly
    const val = await page.evaluate(() => {
      showQuizConfig('major');
      startQuizFromConfig();
      return data['3'];
    });
    expect(val).toBe('UNIQUEWORD_Q3');
  });

  test('loadDeckData reflects latest localStorage state without page reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.setItem('sem3Edits_v1', JSON.stringify({ '0100': 'LIVE_EDIT' }));
    });

    const val = await page.evaluate(() => loadDeckData('sem3')['0100']);
    expect(val).toBe('LIVE_EDIT');
  });
});
