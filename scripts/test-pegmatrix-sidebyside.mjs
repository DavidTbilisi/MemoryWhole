import { chromium } from 'playwright'

async function testPegMatrixImages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('Testing PEG Matrix side-by-side images...\n')
    
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    
    // Get page content and find PEG Matrix button
    const buttons = await page.locator('button').all()
    let found = false
    
    for (const btn of buttons) {
      const text = await btn.textContent()
      if (text && text.includes('PEG Matrix')) {
        console.log('✓ Found PEG Matrix deck, clicking...')
        await btn.click()
        found = true
        break
      }
    }
    
    if (!found) {
      throw new Error('Could not find PEG Matrix button')
    }
    
    await page.waitForTimeout(2000)
    
    // Start quiz without selecting items (should use all or defaults)
    const quizBtn = await page.locator('button').filter({ hasText: /Start Quiz/ }).first()
    if (await quizBtn.isVisible()) {
      console.log('✓ Starting Quiz...\n')
      await quizBtn.click()
      await page.waitForTimeout(2500)
    }
    
    // Get the first few option images
    const optionImages = await page.locator('img').evaluateAll(imgs =>
      imgs
        .filter(img => img.src && img.src.includes('data:image/svg'))
        .slice(0, 2) // Get first 2 option images
        .map(img => ({
          src: img.src,
          alt: img.alt
        }))
    )
    
    console.log(`Found ${optionImages.length} SVG images\n`)
    
    optionImages.forEach((img, i) => {
      console.log(`Option ${i + 1} (${img.alt}):`)
      
      // Decode the SVG to see what's inside
      try {
        const decoded = decodeURIComponent(img.src.replace('data:image/svg+xml;utf8,', ''))
        
        // Check if it has image references
        const hasXlinkHref = decoded.includes('xlink:href')
        const imageMatches = decoded.match(/xlink:href="([^"]+)"/g)
        
        if (hasXlinkHref && imageMatches) {
          console.log(`  ✓ Composite image detected (${imageMatches.length} images)`)
          imageMatches.forEach((match, j) => {
            const url = match.replace('xlink:href="', '').replace('"', '')
            const filename = url.split('/').slice(-1)[0].substring(0, 50)
            console.log(`    Image ${j + 1}: ...${filename}`)
          })
        } else if (decoded.includes('text x=')) {
          console.log(`  • Generated SVG with emoji`)
        } else {
          console.log(`  ? Unknown image type`)
        }
      } catch (e) {
        console.log(`  ? Could not decode SVG`)
      }
      console.log()
    })
    
  } catch (error) {
    console.error('Test error:', error.message)
  } finally {
    await browser.close()
  }
}

testPegMatrixImages()
