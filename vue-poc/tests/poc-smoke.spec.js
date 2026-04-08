const { test, expect } = require('@playwright/test');

test('PoC Quiz saves masteryPeak_v1', async ({ page }) => {
  await page.goto('http://127.0.0.1:5174/');
  await page.waitForSelector('text=Start Quiz');
  await page.click('text=Start Quiz');
  // pick the first available answer button
  await page.waitForSelector('button.ans-btn');
  await page.click('button.ans-btn');
  await page.click('text=Finish & Save');

  // read localStorage
  const peaks = await page.evaluate(() => localStorage.getItem('masteryPeak_v1'));
  console.log('masteryPeak_v1=', peaks);
  expect(peaks).not.toBeNull();
});
