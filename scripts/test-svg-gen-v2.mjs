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

// Test with actual Wikimedia URLs
const audioUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sesame_seed_hamburger_buns.jpg/330px-Sesame_seed_hamburger_buns.jpg"
const visualUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Paintbrushes.jpg/330px-Paintbrushes.jpg"

console.log('Testing side-by-side image generation:\n')

const result = makeSideBySideImageDataUri(audioUrl, visualUrl)

// Decode to check actual content
const decoded = decodeURIComponent(result.replace('data:image/svg+xml;utf8,', ''))

console.log('SVG Structure Analysis:')
console.log(`  - Total length: ${result.length} bytes`)
console.log(`  - Image elements: ${(decoded.match(/<image/g) || []).length}`)
console.log(`  - Has xlink namespace: ${decoded.includes('xmlns:xlink')}`)

// Extract the xlink:href values
const hrefMatches = decoded.match(/xlink:href="([^"]+)"/g) || []
console.log(`  - xlink:href attributes: ${hrefMatches.length}\n`)

if (hrefMatches.length >= 2) {
  console.log('✓ Success! Both images are embedded in the SVG\n')
  console.log('Embedded image URLs:')
  
  const audio = hrefMatches[0].replace('xlink:href="', '').replace('"', '')
  const visual = hrefMatches[1].replace('xlink:href="', '').replace('"', '')
  
  console.log(`  1. Audio: ${audio.split('/').pop()}`)
  console.log(`     Full: ${audio.substring(0, 80)}...`)
  console.log(`  2. Visual: ${visual.split('/').pop()}`)
  console.log(`     Full: ${visual.substring(0, 80)}...`)
  
  // Check if the URLs match what we put in
  if (audio === audioUrl && visual === visualUrl) {
    console.log('\n✓ URLs are correctly embedded (exact match)')
  } else {
    console.log('\n⚠ URLs might be slightly different but both are present')
  }
} else {
  console.log(`✗ Only ${hrefMatches.length} image URLs found (expected 2)`)
}
