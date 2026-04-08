import { chromium } from 'playwright'

async function testPegMatrixImages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    console.log('Testing PEG Matrix side-by-side images...\n')
    
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    
    // Find "Peg Matrix" text and get its parent container
    const pegMatrixSection = page.locator(':text("Peg Matrix")').first()
    
    // Find the Start Quiz button within the Peg Matrix section
    const startButton = pegMatrixSection.locator('..').locator('button:has-text("▶")').first()
    
    console.log('Clicking Start Quiz for Peg Matrix...')
    await startButton.click({ timeout: 5000 })
    
    await page.waitForTimeout(3000)
    
    // Now get the quiz options
    const optionButtons = await page.locator('button').filter({
      has: page.locator('img')
    }).all()
    
    console.log(`Found ${optionButtons.length} option buttons\n`)
    
    if (optionButtons.length > 0) {
      // Check the first option
      const firstButton = optionButtons[0]
      const optionText = await firstButton.textContent()
      console.log(`First option text: "${optionText.trim()}"`)
      
      const img = firstButton.locator('img').first()
      const src = await img.getAttribute('src')
      
      if (src && src.includes('data:image/svg')) {
        // Decode the SVG
        const decoded = decodeURIComponent(src.replace('data:image/svg+xml;utf8,', ''))
        
        // Check for xlink:href (embedded images)
        const imageMatches = decoded.match(/xlink:href="([^"]+)"/g)
        
        if (imageMatches && imageMatches.length > 1) {
          console.log(`✓ SIDE-BY-SIDE IMAGES DETECTED (${imageMatches.length} images)\n`)
          console.log('Embedded images:')
          
          imageMatches.forEach((match, i) => {
            const url = match.replace('xlink:href="', '').replace('"', '')
            const filename = url.split('/').pop()
            console.log(`  ${i + 1}. ${filename.substring(0, 60)}`)
          })
          
          // Try to verify which is audio and which is visual
          console.log('\nVerifying image sources:')
          const firstUrl = imageMatches[0].replace('xlink:href="', '').replace('"', '')
          const secondUrl = imageMatches[1].replace('xlink:href="', '').replace('"', '')
          
          const firstFile = firstUrl.split('/').pop().toLowerCase()
          const secondFile = secondUrl.split('/').pop().toLowerCase()
          
          // Audio images typically are: Hero, Bun, Shoe, Tree, Door, Hive, Sticks, Heaven, Gate, Wine
          const audioKeywords = ['achilles', 'hero', 'hamburger', 'bun', 'shoe', 'skor', 'tree', 'door', 'beehive', 'sticks', 'heaven', 'gate', 'wine', 'paradise']
          // Visual images typically are: Ball, Paintbrush, Swan, Heart, Yacht, Hook, Bomb, Axe, Hourglass, Balloon
          const visualKeywords = ['ball', 'paintbrush', 'paint', 'swan', 'heart', 'yacht', 'hook', 'crane', 'bomb', 'axe', 'hourglass', 'balloon', 'congrats']
          
          const isAudio1 = audioKeywords.some(kw => firstFile.includes(kw))
          const isVisual1 = visualKeywords.some(kw => firstFile.includes(kw))
          const isAudio2 = audioKeywords.some(kw => secondFile.includes(kw))
          const isVisual2 = visualKeywords.some(kw => secondFile.includes(kw))
          
          console.log(`  Image 1: ${isAudio1 ? '🔊 AUDIO' : isVisual1 ? '👁️ VISUAL' : '?'} image`)
          console.log(`  Image 2: ${isAudio2 ? '🔊 AUDIO' : isVisual2 ? '👁️ VISUAL' : '?'} image`)
          
        } else if (imageMatches && imageMatches.length === 1) {
          console.log(`✗ Only ONE image detected - side-by-side NOT working\n`)
          const url = imageMatches[0].replace('xlink:href="', '').replace('"', '')
          console.log(`Image: ${url.split('/').pop().substring(0, 60)}`)
        } else {
          console.log(`✗ No embedded images found - checking SVG content...`)
          if (decoded.includes('text x=')) {
            console.log('  Found text element - this is a fallback SVG, not real images')
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

testPegMatrixImages()
