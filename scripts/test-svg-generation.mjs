// Test the image generation logic directly
function encodeSvg(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function makeSideBySideImageDataUri(audioUrl = '', visualUrl = '') {
  const safeAudioUrl = String(audioUrl || '').replace(/"/g, '&quot;')
  const safeVisualUrl = String(visualUrl || '').replace(/"/g, '&quot;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="640" height="200" viewBox="0 0 640 200"><rect width="640" height="200" fill="#0f172a"/><image x="10" y="10" width="300" height="180" xlink:href="${safeAudioUrl}" preserveAspectRatio="xMidYMid slice"/><image x="330" y="10" width="300" height="180" xlink:href="${safeVisualUrl}" preserveAspectRatio="xMidYMid slice"/></svg>`
  return encodeSvg(svg)
}

// Test with actual Wikimedia URLs (samples from the data)
const audioUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sesame_seed_hamburger_buns.jpg/330px-Sesame_seed_hamburger_buns.jpg"
const visualUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Paintbrushes.jpg/330px-Paintbrushes.jpg"

console.log('Testing side-by-side image generation:\n')

const result = makeSideBySideImageDataUri(audioUrl, visualUrl)

console.log('Generated data URI length:', result.length)
console.log('First 200 chars:', result.substring(0, 200))
console.log('\n...\n')
console.log('Last 100 chars:', result.substring(result.length - 100))

// Check if both URLs are in the SVG
if (result.includes(audioUrl) && result.includes(visualUrl)) {
  console.log('\n✓ Both audio and visual URLs are embedded in the SVG')
  console.log(`  Audio URL: ${audioUrl.split('/').pop()}`)
  console.log(`  Visual URL: ${visualUrl.split('/').pop()}`)
} else {
  let issues = []
  if (!result.includes(audioUrl)) issues.push('Audio URL missing')
  if (!result.includes(visualUrl)) issues.push('Visual URL missing')
  console.log('\n✗ Issue:', issues.join(', '))
}

// Decode and analyze
const decoded = decodeURIComponent(result.replace('data:image/svg+xml;utf8,', ''))
console.log('\nDecoded SVG structure:')
console.log('- Has xlink namespace:', decoded.includes('xlink:href'))
console.log('- Number of image elements:', (decoded.match(/<image/g) || []).length)
console.log('- Image width/height: 300x180 each (should be visible side-by-side)')

// Show the actual SVG
console.log('\nGenerated SVG:')
console.log(decoded.substring(0, 300) + '...\n')
