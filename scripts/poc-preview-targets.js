const playwright = require('playwright');
const path = require('path');

async function capture(deckLabel, index, slug) {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  await page.goto('http://127.0.0.1:5175/');
  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: /preview/i }).nth(index).click();
  await page.waitForLoadState('networkidle');
  const out = path.resolve(__dirname, '..', 'vue-poc', `preview-${slug}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`saved ${deckLabel}: ${out}`);
  await browser.close();
}

(async () => {
  await capture('major', 0, 'major');
  await capture('sem3', 1, 'sem3');
  await capture('pao', 4, 'pao');
  await capture('biblebooks', 8, 'biblebooks');
})();
