import { chromium } from 'playwright'

async function testPegMatrixImages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('Testing PEG Matrix side-by-side images...\n')
    
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    
    // Use Playwright's text selector to find "Peg Matrix"
    const pegMatrixElement = page.getByText('Peg Matrix')
    
    // Scroll it into view
    await pegMatrixElement.scrollIntoViewIfNeeded()
    
    // Find the nearest button with the play icon after the "Peg Matrix" text
    const buttons = await page.locator('button').all()
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      if (text && text.includes('▶')) {
        const prev = i > 0 ? await buttons[i-1].textContent() : ''
        const prevPrev = i > 1 ? await buttons[i-2].textContent() : ''
        
        // Check if this button is near "Peg Matrix"
        if (prev.includes('🔲') || prevPrev.includes('Matrix') || prev.includes('Audio') && prevPrev.includes('🔲')) {
          console.log('Found Peg Matrix Start Quiz button')
          await buttons[i].click()
          await page.waitForTimeout(3000)
          break
        }
      }
    }
    
    // Get quiz options
    const optionButtons = await page.locator('button').filter({
      has: page.locator('img')
    }).all()
    
    console.log(`Found ${optionButtons.length} option buttons\n`)
    
    if (optionButtons.length > 0) {
      const firstButton = optionButtons[0]
      const optionText = await firstButton.textContent()
      console.log(`First option: "${optionText.trim()}"`)
      
      const img = firstButton.locator('img').first()
      const src = await img.getAttribute('src')
      
      if (!src) {
        console.log('✗ No image src found')
        return
      }
      
      if (src.includes('data:image/svg')) {
        const decoded = decodeURIComponent(src.replace('data:image/svg+xml;utf8,', ''))
        const imageMatches = decoded.match(/xlink:href="([^"]+)"/g)
        
        if (imageMatches) {
          console.log(`\nFound ${imageMatches.length} embedded image URLs\n`)
          
          if (imageMatches.length >= 2) {
            console.log('✓ SIDE-BY-SIDE IMAGES DETECTED!\n')
            console.log('Images embedded in SVG:')
            
            const urls = imageMatches.map(m => m.replace('xlink:href="', '').replace('"', ''))
            
            urls.forEach((url, i) => {
              const filename = url.split('/').pop()
              console.log(`  ${i + 1}. ${filename.substring(0, 65)}`)
            })
            
            // Analyze which is audio and which is visual
            console.log('\nImage analysis:')
            const audioKeywords = ['achilles', 'hamburger', 'bun', 'skor', 'shoe', 'tree', 'door', 'beehive', 'hive', 'sticks', 'paradise', 'gate', 'wine']
            const visualKeywords = ['ball', 'paint', 'swan', 'heart', 'yacht', 'crane', 'hook', 'bomb', 'axe', 'hourglass', 'balloon']
            
            urls.forEach((url, i) => {
              const file = url.toLowerCase()
              const isAudio = audioKeywords.some(kw => file.includes(kw))
              const isVisual = visualKeywords.some(kw => file.includes(kw))
              const type = isAudio ? '🔊 AUDIO' : isVisual ? '👁️ VISUAL' : '?'
              console.log(`  Image ${i + 1}: ${type}`)
            })
            
          } else {
            console.log('✗ ISSUE: Only 1 image embedded (should be 2)')
            if (imageMatches.length === 1) {
              const url = imageMatches[0].replace('xlink:href="', '').replace('"', '')
              console.log(`  Image: ${url.split('/').pop()}`)
            }
          }
        } else {
          console.log('✗ No xlink:href found - images not embedded as expected')
          // Check if it's a fallback SVG
          if (decoded.includes('text x=')) {
            console.log('  This appears to be a text-based fallback SVG')
          }
        }
      } else {
        console.log(`Image is not SVG: ${src.substring(0, 100)}...`)
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
    console.error(error.stack)
  } finally {
    await browser.close()
  }
}

testPegMatrixImages()
