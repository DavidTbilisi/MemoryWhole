import { test, expect } from '@playwright/test';

test.describe('Quiz', () => {
  test('config screen shows all Major System ranges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-section').first().locator('button').first().click();
    await expect(page.locator('#quiz-config')).toBeVisible();
    await expect(page.locator('.config-title')).toContainText('Major System');

    const buttons = await page.locator('.subset-btn').all();
    expect(buttons.length).toBe(10);

    const labels = [];
    for (const btn of buttons) {
      labels.push(await btn.textContent());
    }
    expect(labels).toEqual(['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80–89', '90–99']);
  });

  test('should show only 0-9 when selecting single range', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('.deck-section').first().locator('button').first().click();
    await expect(page.locator('#quiz-config')).toBeVisible();

    // Deselect all except 0-9
    const buttons = await page.locator('.subset-btn').all();
    for (let i = 1; i < buttons.length; i++) {
      await buttons[i].click();
      await page.waitForTimeout(50);
    }

    await page.locator('button:has-text("Start Quiz")').last().click();
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });

    // Collect numbers shown in 10 questions
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
});
