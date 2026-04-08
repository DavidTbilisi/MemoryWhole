const playwright = require('playwright');
(async ()=>{
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log('Going to PoC URL');
  await page.goto('http://127.0.0.1:5174/');
  await page.waitForSelector('text=Start Quiz', { timeout: 10000 });
  await page.click('text=Start Quiz');
  await page.waitForSelector('button.ans-btn');
  // Try up to 8 attempts: click an answer, if wrong press Next and retry
  let gotCorrect = false;
  for (let i = 0; i < 8; i++) {
    await page.waitForSelector('button.ans-btn');
    await page.click('button.ans-btn');
    // check for correct or wrong feedback
    try {
      await page.waitForSelector('text=✓ Correct!', { timeout: 800 });
      gotCorrect = true;
      break;
    } catch (e) {
      try {
        await page.waitForSelector('text=✗ Wrong', { timeout: 800 });
        // advance to next question
        await page.click('text=Next');
        await page.waitForTimeout(150);
      } catch (e2) {
        // fallback small wait
        await page.waitForTimeout(200);
      }
    }
  }
  await page.click('text=Finish & Save');
  const peaks = await page.evaluate(() => localStorage.getItem('masteryPeak_v1'));
  console.log('masteryPeak_v1=', peaks);
  await browser.close();
})();
