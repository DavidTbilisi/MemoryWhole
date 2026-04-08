// Comprehensive test simulating the entire image flow for pegmatrix

console.log('=== PEG MATRIX IMAGE FLOW TEST ===\n')

// Step 1: Simulate PEG_MATRIX_IMAGES with audio and visual
const PEG_AUDIO = {
  1: 'Bun',   2: 'Shoe'
}

const PEG_VISUAL = {
  1: 'Paintbrush', 2: 'Swan'
}

const PEG_IMAGES = {
  audio: {
    1: 'https://example.com/bun.jpg',  
    2: 'https://example.com/shoe.jpg'
  },
  visual: {
    1: 'https://example.com/paintbrush.jpg',
    2: 'https://example.com/swan.jpg'
  }
}

// Step 2: Build PEG_MATRIX_IMAGES
const PEG_MATRIX_IMAGES = {}
for (let i = 0; i <= 99; i++) {
  const key = String(i).padStart(2, '0')
  const audioIdx = Math.floor(i / 10)
  const visualIdx = i % 10
  PEG_MATRIX_IMAGES[key] = {
    audio: PEG_IMAGES.audio[audioIdx],
    visual: PEG_IMAGES.visual[visualIdx]
  }
}

console.log('Step 1: PEG_MATRIX_IMAGES created')
console.log(`  Sample [11]: ${JSON.stringify(PEG_MATRIX_IMAGES['11'])}`)
console.log(`  Sample [12]: ${JSON.stringify(PEG_MATRIX_IMAGES['12'])}\n`)

// Step 3: LEGACY_DEFAULT_IMAGES mapping
const LEGACY_DEFAULT_IMAGES = {
  pegmatrix: PEG_MATRIX_IMAGES
}

console.log('Step 2: LEGACY_DEFAULT_IMAGES["pegmatrix"] = PEG_MATRIX_IMAGES')
const pegMatrixImages = LEGACY_DEFAULT_IMAGES['pegmatrix']
console.log(`  [11] from LEGACY: ${JSON.stringify(pegMatrixImages['11'])}\n`)

// Step 4: buildDefaultDeckImages function
function buildDefaultDeckImages(deck) {
  const legacy = LEGACY_DEFAULT_IMAGES[deck] || {}
  
  // Simulate deck data
  const merged = {}
  for (let i = 0; i <= 12; i++) {
    const key = String(i).padStart(2, '0')
    merged[key] = `Entry ${i}`
  }
  
  const out = {}
  for (const [key, value] of Object.entries(merged)) {
    const normalizedKey = String(key)
    const paddedKey = normalizedKey.padStart(2, '0')
    const legacyImg = legacy[normalizedKey] || legacy[paddedKey]
    out[normalizedKey] = legacyImg || `fallback_${key}`
  }
  return out
}

const defaultImages = buildDefaultDeckImages('pegmatrix')

console.log('Step 3: buildDefaultDeckImages("pegmatrix")')
console.log(`  Type of [11]: ${typeof defaultImages['11']}`)
console.log(`  Value: ${JSON.stringify(defaultImages['11'])}\n`)

// Step 5: Quiz.vue optionImage logic
function makeSideBySideImageDataUri(audioUrl = '', visualUrl = '') {
  if (!audioUrl && !visualUrl) {
    return 'fallback_emoji'
  }
  return `SVG_WITH_BOTH:${audioUrl?.split('/').pop()}_AND_${visualUrl?.split('/').pop()}`
}

function optionImage(key, imageMap) {
  const img = imageMap[String(key)]
  
  // Handle dual images (audio + visual)
  if (img && typeof img === 'object' && img.audio && img.visual) {
    return makeSideBySideImageDataUri(img.audio, img.visual)
  }
  
  return img || 'fallback_emoji'
}

console.log('Step 4: Quiz.vue optionImage() logic')
console.log(`  For [11]: ${optionImage('11', defaultImages)}`)
console.log(`  For [12]: ${optionImage('12', defaultImages)}\n`)

// Verify the result
const result11 = optionImage('11', defaultImages)
const result12 = optionImage('12', defaultImages)

if (result11.includes('bun') && result11.includes('paintbrush')) {
  console.log('✓ [11] SUCCESS: Shows both Bun (audio) + Paintbrush (visual)')
} else {
  console.log('✗ [11] FAILED: Not showing correct images')
}

if (result12.includes('shoe') && result12.includes('swan')) {
  console.log('✓ [12] SUCCESS: Shows both Shoe (audio) + Swan (visual)')
} else {
  console.log('✗ [12] FAILED: Not showing correct images')
}

console.log('\n=== TEST COMPLETE ===')
