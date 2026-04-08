import { chromium } from 'playwright'

async function testPegMatrix() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('Testing PEG Matrix side-by-side images...\n')
    
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    
    // Find all text content to locate deck names
    const allText = await page.evaluate(() => document.body.innerText)
    
    if (allText.includes('PEG Matrix')) {
      console.log('✓ Found PEG Matrix on page')
      // Find the start quiz button that's near PEG Matrix
      const locator = page.locator('button:has-text("▶ Start Quiz")').first()
      
      // Try to click it
      await locator.click({ timeout: 5000 })
      console.log('✓ Clicked Start Quiz\n')
      
      await page.waitForTimeout(2500)
      
      // Get first option text and image
      const firstOption = await page.locator('button').filter({ 
        has: page.locator('img') 
      }).first()
      
      const optionText = await firstOption.textContent()
      console.log(`First option: "${optionText}"`)
      
      // Get the image source
      const img = firstOption.locator('img').first()
      const src = await img.getAttribute('src')
      
      if (src) {
        console.log(`Image src length: ${src.length}`)
        
        // Decode and check structure
        const decoded = decodeURIComponent(src.replace('data:image/svg+xml;utf8,', ''))
        
        // Count xlink:href occurrences
        const matches = decoded.match(/xlink:href="/g)
        const imageCount = matches ? matches.length : 0
        
        console.log(`Number of embedded images: ${imageCount}`)
        
        if (imageCount > 1) {
          console.log('✓ Multiple images detected (side-by-side should be working)')
          
          // Extract the actual URLs
          const urlMatches = decoded.match(/xlink:href="([^"]+)"/g)
          if (urlMatches) {
            console.log('\nEmbedded image URLs:')
            urlMatches.forEach((match, i) => {
              const url = match.replace('xlink:href="', '').replace('"', '')
              const filename = url.split('/').pop().substring(0, 50)
              console.log(`  ${i + 1}. ...${filename}`)
              // Try to figure out which is audio vs visual
              if (url.includes('Achilles') || url.includes('Sesame') || url.includes('hamburger') || url.includes('Skor')) {
                console.log(`     → This looks like PEG_AUDIO`)
              } else if (url.includes('ball') || url.includes('paint') || url.includes('Swan')) {
                console.log(`     → This looks like PEG_VISUAL`)
              }
            })
          }
        } else if (imageCount === 1) {
          console.log('✗ Only one image detected - side-by-side not working')
        } else {
          console.log('? Could not find embedded images')
        }
      }
      
    } else {
      console.log('✗ PEG Matrix not found on page')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

testPegMatrix()
