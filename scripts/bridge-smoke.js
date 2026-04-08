const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle' });

  const frame = page.frameLocator('iframe[title="MemoryWhole Legacy App"]');
  await frame.getByRole('button', { name: /Start Quiz/i }).first().click();
  await frame.locator('#quiz-config.active').waitFor({ timeout: 8000 });
  await frame.locator('#quiz-config').getByRole('button', { name: /Start Quiz/i }).first().click();
  await frame.locator('#quiz.active').waitFor({ timeout: 15000 });
  await frame.locator('#q-number').first().waitFor({ timeout: 15000 });

  console.log('bridge smoke ok');
  await browser.close();
})().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
