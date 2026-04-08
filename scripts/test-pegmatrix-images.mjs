import { chromium } from 'playwright'

async function testPegMatrixImages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    
    console.log('Testing PEG Matrix linked images...\n')
    
    // Get all buttons that might be deck cards
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons on page`)
    
    // Find and click PEG Matrix button
    let found = false
    for (const btn of buttons) {
      const text = await btn.textContent()
      if (text && text.includes('PEG Matrix')) {
        console.log('Clicking PEG Matrix...')
        await btn.click()
        found = true
        break
      }
    }
    
    if (!found) {
      throw new Error('Could not find PEG Matrix button')
    }
    
    await page.waitForTimeout(2000)
    
    // Try to start quiz directly if we can find the button
    const quizBtn = await page.locator('button').filter({ hasText: /Start Quiz/ }).first()
    if (await quizBtn.isVisible()) {
      console.log('Starting Quiz...')
      await quizBtn.click()
      await page.waitForTimeout(2500)
    }
    
    // Capture all img src attributes with wikimedia
    const allImages = await page.locator('img').evaluateAll(imgs =>
      imgs.map(img => img.src).filter(src => src && (src.includes('wikimedia') || src.includes('data:image/svg')))
    )
    
    const wikiImages = allImages.filter(src => src.includes('wikimedia'))
    const svgImages = allImages.filter(src => src.includes('data:image/svg'))
    
    console.log(`\nResults:`)
    console.log(`  Wikimedia images: ${wikiImages.length}`)
    console.log(`  SVG fallbacks: ${svgImages.length}`)
    
    if (wikiImages.length > 0) {
      console.log(`\n✓ PEG Matrix is using linked peg images!`)
      wikiImages.slice(0, 3).forEach((url, i) => {
        const filename = url.split('/').slice(-1)[0].substring(0, 40)
        console.log(`    ${filename}...`)
      })
    } else if (svgImages.length > 0) {
      console.log(`\n⚠ Using SVG fallbacks (images may not be mapped yet)`)
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
  } finally {
    await browser.close()
  }
}

testPegMatrixImages()
