import fs from 'fs'
import path from 'path'

// Read peg-matrix.js and check what images are being exported
const pegMatrixPath = './vue-poc/src/data/peg-matrix.js'
const content = fs.readFileSync(pegMatrixPath, 'utf-8')

// Check if PEG_MATRIX_IMAGES contains objects with audio and visual
if (content.includes('audio: PEG_IMAGES.audio') && content.includes('visual: PEG_IMAGES.visual')) {
  console.log('✓ PEG_MATRIX_IMAGES structure looks correct (has audio and visual)')
} else {
  console.log('✗ PEG_MATRIX_IMAGES might not have the right structure')
}

// Check export statement
if (content.includes('export') && content.includes('PEG_MATRIX_IMAGES')) {
  console.log('✓ PEG_MATRIX_IMAGES is exported')
} else {
  console.log('✗ PEG_MATRIX_IMAGES might not be exported')
}

// Now check deck-loader.js
const loaderPath = './vue-poc/src/core/deck-loader.js'
const loaderContent = fs.readFileSync(loaderPath, 'utf-8')

// Check if it imports PEG_MATRIX_IMAGES
if (loaderContent.includes('PEG_MATRIX_IMAGES')) {
  console.log('✓ deck-loader imports PEG_MATRIX_IMAGES')
} else {
  console.log('✗ deck-loader does NOT import PEG_MATRIX_IMAGES')
}

// Check if makeSideBySideImageDataUri is defined
if (loaderContent.includes('makeSideBySideImageDataUri')) {
  console.log('✓ makeSideBySideImageDataUri function exists')
  
  // Check the function definition
  const funcMatch = loaderContent.match(/makeSideBySideImageDataUri[^}]+}/s)
  if (funcMatch) {
    const funcDef = funcMatch[0]
    if (funcDef.includes('xlink:href')) {
      console.log('  ✓ Uses xlink:href to embed images')
    } else {
      console.log('  ✗ Does not use xlink:href')
    }
  }
} else {
  console.log('✗ makeSideBySideImageDataUri function NOT found')
}

// Check Quiz.vue
const quizPath = './vue-poc/src/components/Quiz.vue'
const quizContent = fs.readFileSync(quizPath, 'utf-8')

if (quizContent.includes('makeSideBySideImageDataUri')) {
  console.log('✓ Quiz.vue imports makeSideBySideImageDataUri')
  
  // Check if optionImage method has the dual image logic
  const optionImageMatch = quizContent.match(/optionImage\s*\([^)]*\)\s*\{[^}]*typeof img === 'object'[^}]*\}/s)
  if (optionImageMatch) {
    console.log('✓ optionImage checks for object type (dual images)')
  } else {
    console.log('✗ optionImage might not handle object type')
  }
} else {
  console.log('✗ Quiz.vue does NOT import makeSideBySideImageDataUri')
}

console.log('\n--- Summary ---')
console.log('Code review complete. Check output above for any issues.')
