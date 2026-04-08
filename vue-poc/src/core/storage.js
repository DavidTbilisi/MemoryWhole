export function readJson(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function readDeckMap(key, deck) {
  const root = readJson(key, {})
  return root[deck] || {}
}

export function writeDeckMap(key, deck, value) {
  const root = readJson(key, {})
  root[deck] = value
  writeJson(key, root)
}
