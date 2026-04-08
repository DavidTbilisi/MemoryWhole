import { chromium } from 'playwright'

async function testSimpleEmojiFallback() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Navigate to home
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000) // Give page time to fully render
    
    // Get page content to debug
    const content = await page.content()
    if (content.includes('Major System')) {
      console.log('Page loaded successfully')
    } else {
      console.log('Page content:', content.substring(0, 500))
    }
    
    // Click on Major deck 
    try {
      await page.click('text=Major System', { timeout: 5000 })
    
    // Click "Toggle All" to select all items
    await page.locator('button').filter({ hasText: 'Toggle All' }).click()
    await page.waitForLoadState('networkidle')
    
    // Start quiz
    await page.locator('button').filter({ hasText: 'Start Quiz' }).click()
    await page.waitForLoadState('networkidle')
    
    // Get all option image sources
    const imageSrcs = await page.locator('img[src*="data:image/svg+xml"]').evaluateAll(
      imgs => imgs.map(img => img.src)
    )
    
    console.log(`Found ${imageSrcs.length} SVG images in quiz options`)
    
    // Check how many have the verbose "Replace via Editor" text
    let verboseCount = 0
    let cleanCount = 0
    
    for (const src of imageSrcs) {
      if (src.includes('Replace%20via%20Editor') || src.includes('Replace via Editor')) {
        verboseCount++
      } else {
        cleanCount++
      }
    }
    
    console.log(`\nResults:`)
    console.log(`  Verbose (with text): ${verboseCount}`)
    console.log(`  Clean (emoji only):   ${cleanCount}`)
    
    if (cleanCount > 0) {
      console.log(`\n✓ SUCCESS: Found ${cleanCount} clean emoji-only fallback images!`)
      console.log(`  Sample: ${imageSrcs.find(s => !s.includes('Replace'))?.substring(0, 100)}...`)
    } else {
      console.log(`\n✗ ISSUE: All ${verboseCount} images are verbose. Simple emoji fallback may not be active.`)
    }
    
  } catch (error) {
    console.error('Test error:', error)
  } finally {
    await browser.close()
  }
}

testSimpleEmojiFallback()
