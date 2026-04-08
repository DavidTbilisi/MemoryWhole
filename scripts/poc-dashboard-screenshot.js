const playwright = require('playwright');
const path = require('path');

(async ()=>{
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({viewport:{width:1366,height:1000}});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5175/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /stats/i }).first().click();
  await page.waitForLoadState('networkidle');
  const out = path.resolve(__dirname, '..', 'vue-poc', 'dashboard-screenshot.png');
  await page.screenshot({path: out, fullPage: true});
  console.log('dashboard screenshot saved:', out);
  await browser.close();
})();
