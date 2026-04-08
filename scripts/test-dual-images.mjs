import { chromium } from 'playwright'

async function testDualImages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('Testing Dual Image Rendering\n')
    
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    
    // Get all text content to find Peg Matrix
    const full = await page.evaluate(() => document.body.innerText)
    
    if (!full.includes('Peg Matrix')) {
      console.log('✗ Peg Matrix not found on page')
      return
    }
    
    // Click first Start Quiz button to access Peg Matrix
    const buttons = await page.locator('button').all()
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      if (text && text.includes('▶')) {
        // Check context - look for previous buttons
        let found = false
        if (i >= 12) { // Peg Matrix should be around button 12+ 
          const contextText = await page.evaluate((idx) => {
            const allButtons = document.querySelectorAll('button')
            let context = ''
            for (let j = Math.max(0, idx - 3); j < idx; j++) {
              context += allButtons[j].textContent + ' '
            }
            return context
          }, i)
          
          if (contextText.includes('🔲') && contextText.includes('Matrix')) {
            console.log('✓ Found Peg Matrix Start Quiz button')
            await buttons[i].click()
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    await page.waitForTimeout(3500)
    
    // Now check the quiz images
    const optionButtons = await page.locator('button').all()
    
    // Filter to just the option buttons that have images
    let optionWithImages = []
    for (const btn of optionButtons) {
      const imgs = await btn.locator('img').all()
      if (imgs.length > 0) {
        optionWithImages.push({ btn, imgs })
      }
    }
    
    console.log(`Found ${optionWithImages.length} option buttons with images\n`)
    
    if (optionWithImages.length > 0) {
      const firstOption = optionWithImages[0]
      const optionText = await firstOption.btn.textContent()
      const imageCount = firstOption.imgs.length
      
      console.log(`First option: "${optionText.trim()}"`)
      console.log(`Number of images in option: ${imageCount}`)
      
      if (imageCount >= 2) {
        console.log('\n✓ SUCCESS! Option has 2+ images (audio + visual)\n')
        
        // Get the image sources
        for (let i = 0; i < Math.min(imageCount, 2); i++) {
          const src = await firstOption.imgs[i].getAttribute('src')
          const alt = await firstOption.imgs[i].getAttribute('alt')
          
          if (src && src.includes('wikimedia')) {
            const filename = src.split('/').pop()
            const type = alt && alt.includes('Audio') ? '🔊 AUDIO:' : alt && alt.includes('Visual') ? '👁️ VISUAL:' : '❓'
            console.log(`  ${type} ${filename.substring(0, 55)}`)
          } else if (src && src.includes('data:image')) {
            const type = alt && alt.includes('Audio') ? '🔊 AUDIO:' : alt && alt.includes('Visual') ? '👁️ VISUAL:' : '❓'
            console.log(`  ${type} [Generated emoji/SVG fallback]`)
          }
        }
      } else {
        console.log(`\n✗ ISSUE: Option only has ${imageCount} image(s), expected 2+`)
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
  } finally {
    await browser.close()
  }
}

testDualImages()
