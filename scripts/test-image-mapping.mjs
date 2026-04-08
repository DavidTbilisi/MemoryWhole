// Simulating deck-loader.js image retrieval for pegmatrix

// Sample audio and visual images (from peg-matrix.js)
const PEG_IMAGES = {
  audio: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Achilles_fighting_against_Memnon_Leiden_Rijksmuseum_voor_Oudheden.jpg/330px-Achilles_fighting_against_Memnon_Leiden_Rijksmuseum_voor_Oudheden.jpg",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sesame_seed_hamburger_buns.jpg/330px-Sesame_seed_hamburger_buns.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Skor_fr%C3%A5n_1700-_till_1960-talet_-_Nordiska_Museet_-_NMA.0056302.jpg/330px-Skor_fr%C3%A5n_1700-_till_1960-talet_-_Nordiska_Museet_-_NMA.0056302.jpg",
  },
  visual: {
    0: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Many_balls.jpg/330px-Many_balls.jpg",
    1: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Paintbrushes.jpg/330px-Paintbrushes.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mute_Swan_Emsworth2.JPG/330px-Mute_Swan_Emsworth2.JPG",
  }
}

// Simulate PEG_MATRIX_IMAGES construction
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

console.log('PEG Matrix Images Mapping Test\n')
console.log('Testing entries:')
console.log('(Each entry = Audio (tens digit) + Visual (units digit))\n')

const testEntries = ['00', '01', '02', '10', '11', '12', '20', '27', '99']

testEntries.forEach(entry => {
  const audioIdx = Math.floor(parseInt(entry) / 10)
  const visualIdx = parseInt(entry) % 10
  const img = PEG_MATRIX_IMAGES[entry]
  
  if (img) {
    const audioFile = img.audio ? img.audio.split('/').pop() : 'MISSING'
    const visualFile = img.visual ? img.visual.split('/').pop() : 'MISSING'
    
    console.log(`[${entry}] Audio[${audioIdx}] + Visual[${visualIdx}]`)
    console.log(`      🔊 ${audioFile.substring(0, 60)}`)
    console.log(`      👁️ ${visualFile.substring(0, 60)}`)
  } else {
    console.log(`[${entry}] NO IMAGES FOUND`)
  }
  console.log()
})

// Check if extraction functions work correctly (for pegaudio/pegvisual decks)
function buildPegAudioImages(matrixImages) {
  const out = {}
  for (let i = 0; i <= 9; i++) {
    const key = String(i * 10).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(i)] = typeof imgData === 'object' ? imgData.audio : imgData
  }
  return out
}

function buildPegVisualImages(matrixImages) {
  const out = {}
  for (let j = 0; j <= 9; j++) {
    const key = String(j).padStart(2, '0')
    const imgData = matrixImages[key]
    out[String(j)] = typeof imgData === 'object' ? imgData.visual : imgData
  }
  return out
}

const pegAudioImages = buildPegAudioImages(PEG_MATRIX_IMAGES)
const pegVisualImages = buildPegVisualImages(PEG_MATRIX_IMAGES)

console.log('\nPEG Audio Extraction (for pegaudio deck):')
Object.entries(pegAudioImages).slice(0, 3).forEach(([key, url]) => {
  const file = url ? url.split('/').pop() : 'MISSING'
  console.log(`  [${key}]: ${file.substring(0, 60)}`)
})

console.log('\nPEG Visual Extraction (for pegvisual deck):')
Object.entries(pegVisualImages).slice(0, 3).forEach(([key, url]) => {
  const file = url ? url.split('/').pop() : 'MISSING'
  console.log(`  [${key}]: ${file.substring(0, 60)}`)
})

console.log('\n✓ Image mapping complete')
