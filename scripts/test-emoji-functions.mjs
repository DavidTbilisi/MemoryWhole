import { makeSimpleEmojiFallbackDataUri, makeEmojiFallbackDataUri } from '../vue-poc/src/core/deck-loader.js'

console.log('Testing emoji fallback functions:\n')

// Test verbose emoji fallback
const verboseUrl = makeEmojiFallbackDataUri('🎭', 'My Label')
console.log('Verbose fallback includes label:', verboseUrl.includes('My%20Label'))
console.log('Verbose URL length:', verboseUrl.length)
console.log('')

// Test simple emoji fallback
const simpleUrl = makeSimpleEmojiFallbackDataUri('🎭')
console.log('Simple fallback includes emoji:', simpleUrl.includes('%F0%9F%8E%AD')) // UTF-8 encoded 🎭
console.log('Simple URL length:', simpleUrl.length)
console.log('Simple is shorter than verbose:', simpleUrl.length < verboseUrl.length)
console.log('')

// Test that simple doesn't have "Replace"
const hasReplace = simpleUrl.includes('Replace')
console.log('Simple fallback has "Replace" text:', hasReplace)
console.log('')

// Verify optionImage logic
const imageUrl = 'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22320%22%20height=%22200%22%20viewBox=%220%200%20320%20200%22%3E%3Crect%20width=%22320%22%20height=%22200%22%20fill=%22%230f172a%22/%3E%3Crect%20x=%2212%22%20y=%2212%22%20width=%22296%22%20height=%22176%22%20rx=%2216%22%20fill=%22%23111827%22%20stroke=%22%23334155%22/%3E%3Ctext%20x=%2224%22%20y=%2276%22%20fill=%22%23e2e8f0%22%20font-size=%2222%22%20font-family=%22Verdana,Arial,sans-serif%22%20font-weight=%22700%22%3EMAJOR%2087%3C/text%3E%3Ctext%20x=%2224%22%20y=%22134%22%20font-size=%2256%22%3E🎺%3C/text%3E%3Ctext%20x=%2224%22%20y=%22168%22%20fill=%22%23cbd5e1%22%20font-size=%2214%22%20font-family=%22Verdana,Arial,sans-serif%22%3EReplace%20via%20Editor%20%3E%20Image%20URL/Path%3C/text%3E%3C/svg%3E'

const shouldUseSimple = imageUrl.includes('Replace via Editor') && '🎺'
console.log('Sample generated image has "Replace via Editor":', imageUrl.includes('Replace'))
console.log('Logic: if image has Replace AND emoji exists → use simple fallback')
console.log('')

if (!hasReplace && simpleUrl.length < verboseUrl.length) {
  console.log('✓ SUCCESS: Simple emoji fallback function works correctly!')
} else {
  console.log('✗ ISSUE: Simple emoji fallback may not be working as expected')
}
