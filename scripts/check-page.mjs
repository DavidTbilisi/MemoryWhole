import { chromium } from 'playwright'

async function checkPage() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    
    const full = await page.evaluate(() => document.body.innerText)
    
    console.log('Page content (first 2000 chars):')
    console.log(full.substring(0, 2000))
    
    // Find all deck names mentioned
    const deckNames = ['Major', 'SEM3', 'Peg', 'Bible', 'Calendar', 'Binary', 'Clock', 'Month']
    console.log('\nDeck names found on page:')
    deckNames.forEach(name => {
      if (full.includes(name)) {
        console.log(`  ✓ ${name}`)
      }
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

checkPage()
