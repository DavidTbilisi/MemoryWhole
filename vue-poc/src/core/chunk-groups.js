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

  if (deck === 'pao' || deck === 'pegmatrix' || deck === 'pegmatrixru') {
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
