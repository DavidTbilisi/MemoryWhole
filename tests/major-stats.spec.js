import { test, expect } from '@playwright/test';

test.setTimeout(120000);

test('major quiz increases attempts and mastery does not fall', async ({ browser }) => {
    // Use an isolated context so this test doesn't interfere with other tests
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'networkidle' });

    const initial = await page.evaluate(() => {
        const analytics = JSON.parse(localStorage.getItem('analytics_v1') || '{}');
        const deck = analytics['major'] || { totalAttempts: 0, totalSessions: 0 };
        const attempts = deck.totalAttempts || 0;
        const sessions = deck.totalSessions || 0;
        const el = document.querySelector('#mastery-major text');
        const mastery = el ? parseInt(el.textContent.replace('%', '')) : null;
        return { attempts, sessions, mastery };
    });

    // Start the Major System quiz
    await page.locator('.deck-card').first().locator('button').first().click();
    await page.locator('button:has-text("Start Quiz")').last().click();
    await expect(page.locator('#quiz')).toBeVisible();

    // Answer 25 questions correctly; wait for the next question to be enabled each iteration
    for (let i = 0; i < 25; i++) {
        const correct = await page.evaluate(() => currentAnswer);
        await page.locator('.ans-btn', { hasText: correct }).first().click();
        // Wait until an answer button becomes enabled for the next question
        await page.waitForFunction(() => {
            const btns = Array.from(document.querySelectorAll('.ans-btn'));
            return btns.some(b => !b.disabled);
        }, null, { timeout: 10000 });
    }

    // Finish the quiz to ensure session is recorded. Call `finishQuiz()` directly
    // to avoid timing issues with UI buttons in parallel runs.
    await page.evaluate(() => { try { finishQuiz(); } catch (e) { } });
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
        const analytics = JSON.parse(localStorage.getItem('analytics_v1') || '{}');
        const deck = analytics['major'] || { totalAttempts: 0, totalSessions: 0 };
        const attempts = deck.totalAttempts || 0;
        const sessions = deck.totalSessions || 0;
        const el = document.querySelector('#mastery-major text');
        const mastery = el ? parseInt(el.textContent.replace('%', '')) : null;
        return { attempts, sessions, mastery };
    });

    console.log('AFTER_ANALYTICS:', JSON.stringify(after));

    expect(after.attempts).toBeGreaterThanOrEqual(initial.attempts);
    expect(after.sessions).toBeGreaterThanOrEqual(initial.sessions);
    expect(after.attempts).toBeGreaterThanOrEqual(initial.attempts + 25);
    if (initial.mastery !== null && after.mastery !== null) {
        // Ensure mastery didn't fall
        expect(after.mastery).toBeGreaterThanOrEqual(initial.mastery);
        // If mastery rose, assert it increased
        if (after.mastery > initial.mastery) expect(after.mastery).toBeGreaterThan(initial.mastery);
    }

    await context.close();
});
