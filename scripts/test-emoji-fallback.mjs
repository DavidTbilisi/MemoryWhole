import { chromium } from 'playwright'

async function test() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    
    console.log('Navigating to Major System deck...')
    await page.click('text=Major System')
    await page.waitForTimeout(1500)
    
    console.log('Clicking Toggle All...')
    await page.click('text=Toggle All')
    await page.waitForTimeout(1000)
    
    console.log('Starting Quiz...')
    await page.click('text=Start Quiz')
    await page.waitForTimeout(2000)
    
    // Get option images
    const images = await page.locator('img').evaluateAll(imgs =>
      imgs
        .filter(img => img.src && img.src.includes('data:image/svg'))
        .map(img => img.src)
    )
    
    console.log(`\nFound ${images.length} SVG images`)
    
    // Count verbose vs clean
    const verbose = images.filter(s => s.includes('Replace')).length
    const clean = images.filter(s => !s.includes('Replace')).length
    
    console.log(`Verbose (with "Replace via Editor"): ${verbose}`)
    console.log(`Clean (emoji only): ${clean}`)
    
    if (clean > 0) {
      console.log(`\n✓ SUCCESS! Simple emoji fallback is working.`)
      const sample = images.find(s => !s.includes('Replace'))
      console.log(`Sample URL:\n  ${sample.substring(0, 120)}...`)
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await browser.close()
  }
}

test()
