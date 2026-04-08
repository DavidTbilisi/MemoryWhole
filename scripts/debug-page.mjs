import { chromium } from 'playwright'

async function debugPage() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    
    // Get all button text
    const buttons = await page.locator('button').allTextContents()
    console.log('All button text on page:')
    buttons.slice(0, 20).forEach((text, i) => {
      console.log(`  ${i}: "${text.substring(0, 60)}"`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

debugPage()
