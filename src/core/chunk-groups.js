export function getChunkGroups(deck, dataMap) {
  const keys = Object.keys(dataMap || {})

  if (deck === 'major') {
    return Array.from({ length: 10 }, (_, i) => ({
      label: `${i * 10}-${i * 10 + 9}`,
      keys: Array.from({ length: 10 }, (_, j) => String(i * 10 + j))
    }))
  }

  if (deck === 'sem3') {
    const labels = ['Vision', 'Sound', 'Smell', 'Taste', 'Touch', 'Sensation', 'Animals', 'Birds', 'Rainbow', 'Solar-System']
    return labels.map((label, idx) => ({
      label,
      keys: keys.filter((k) => String(k)[0] === String(idx))
    }))
  }

  if (deck === 'sem3major') {
    return Array.from({ length: 10 }, (_, i) => {
      const start = i * 1000
      const end = start + 999
      const bucket = keys.filter((k) => {
        const value = Number(k)
        return Number.isFinite(value) && value >= start && value <= end
      })
      return { label: `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`, keys: bucket }
    })
  }

  if (deck === 'months') {
    return [
      { label: '1-11', keys: Array.from({ length: 11 }, (_, i) => String(i + 1)) },
      { label: '12-22', keys: Array.from({ length: 11 }, (_, i) => String(i + 12)) },
      { label: '23-33', keys: Array.from({ length: 11 }, (_, i) => String(i + 23)) },
    ]
  }

  if (deck === 'clocks') {
    const sorted = [...keys].sort()
    return [
      { label: '00-05', keys: sorted.slice(0, 6) },
      { label: '06-11', keys: sorted.slice(6, 12) },
      { label: '12-17', keys: sorted.slice(12, 18) },
      { label: '18-23', keys: sorted.slice(18, 24) },
    ]
  }

  if (deck === 'binary') {
    const sorted = [...keys].sort()
    return [
      { label: '0000-0111', keys: sorted.slice(0, 8) },
      { label: '1000-1111', keys: sorted.slice(8, 16) },
    ]
  }

  if (deck === 'binary8') {
    // 256 entries grouped by the first nibble (Matrix 1 = character + form)
    const sorted = [...keys].sort()
    return [
      { label: '0000xxxx', keys: sorted.slice(0, 16) },
      { label: '0001xxxx', keys: sorted.slice(16, 32) },
      { label: '0010xxxx', keys: sorted.slice(32, 48) },
      { label: '0011xxxx', keys: sorted.slice(48, 64) },
      { label: '0100xxxx', keys: sorted.slice(64, 80) },
      { label: '0101xxxx', keys: sorted.slice(80, 96) },
      { label: '0110xxxx', keys: sorted.slice(96, 112) },
      { label: '0111xxxx', keys: sorted.slice(112, 128) },
      { label: '1000xxxx', keys: sorted.slice(128, 144) },
      { label: '1001xxxx', keys: sorted.slice(144, 160) },
      { label: '1010xxxx', keys: sorted.slice(160, 176) },
      { label: '1011xxxx', keys: sorted.slice(176, 192) },
      { label: '1100xxxx', keys: sorted.slice(192, 208) },
      { label: '1101xxxx', keys: sorted.slice(208, 224) },
      { label: '1110xxxx', keys: sorted.slice(224, 240) },
      { label: '1111xxxx', keys: sorted.slice(240, 256) },
    ]
  }

  if (deck === 'hex') {
    const order = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
    const normalize = (k) => String(k).toUpperCase()
    const inDeck = new Set(keys.map(normalize))
    return [
      { label: '0-7', keys: order.slice(0, 8).filter((k) => inDeck.has(k)) },
      { label: '8-F', keys: order.slice(8).filter((k) => inDeck.has(k)) },
    ]
  }

  if (deck === 'primes') {
    return Array.from({ length: 10 }, (_, i) => {
      const start = i * 1000
      const end = i === 9 ? 9999 : start + 999
      const bucket = keys.filter((k) => {
        const value = Number(k)
        return Number.isFinite(value) && value >= start && value <= end
      })
      return { label: `${start}-${end}`, keys: bucket }
    })
  }

  if (deck === 'calendar' || deck === 'bibleoverview') {
    return [{ label: 'All', keys }]
  }

  if (deck === 'biblebooks') {
    return [
      { label: '1-17', keys: Array.from({ length: 17 }, (_, i) => String(i + 1)) },
      { label: '18-39', keys: Array.from({ length: 22 }, (_, i) => String(i + 18)) },
      { label: '40-57', keys: Array.from({ length: 18 }, (_, i) => String(i + 40)) },
      { label: '58-66', keys: Array.from({ length: 9 }, (_, i) => String(i + 58)) },
    ]
  }

  if (deck === 'pao') {
    return Array.from({ length: 10 }, (_, i) => {
      const start = i * 100
      const end = start + 99
      const label = `${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}`
      const inDeck = keys.filter((k) => {
        const value = Number(k)
        return Number.isFinite(value) && value >= start && value <= end
      })
      return { label, keys: inDeck }
    })
  }

  if (deck === 'pegmatrix' || deck === 'pegmatrixru') {
    return Array.from({ length: 10 }, (_, i) => {
      const start = i * 10
      const end = i === 9 ? 99 : start + 9
      const label = `${start}-${end}`
      const set = new Set(Array.from({ length: end - start + 1 }, (_, j) => String(start + j).padStart(2, '0')))
      const inDeck = keys.filter((k) => set.has(String(k)) || set.has(String(k).padStart(2, '0')))
      return { label, keys: inDeck }
    })
  }

  if (deck === 'pegaudio' || deck === 'pegvisual') {
    return [{ label: '0-9', keys: Array.from({ length: 10 }, (_, i) => String(i)) }]
  }

  const sorted = [...keys].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
  const chunks = []
  const size = 10
  for (let i = 0; i < sorted.length; i += size) {
    const part = sorted.slice(i, i + size)
    chunks.push({ label: `${part[0]}-${part[part.length - 1]}`, keys: part })
  }
  return chunks
}
