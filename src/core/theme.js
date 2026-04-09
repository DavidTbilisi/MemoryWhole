export const THEME_KEY = 'theme_v1'

export const THEME_OPTIONS = [
    { id: 'dark-retro', label: 'Dark • Retro' },
    { id: 'dark-pink', label: 'Dark • Pink' },
    { id: 'light-vintage', label: 'Light • Vintage' },
    { id: 'light-pink', label: 'Light • Pink' },
    { id: 'dark-cyber', label: 'Dark • Cyber' },
    { id: 'dark-matrix', label: 'Dark • Matrix' },
    { id: 'dark-neon', label: 'Dark • Neon' },
    { id: 'dark-blue', label: 'Dark • Blue' },
]

export const THEME_SWATCHES = {
    'dark-retro': ['#454040', '#605B51', '#D8D365', '#E6F082'],
    'dark-pink': ['#2E112D', '#540032', '#820333', '#C9283E'],
    'light-vintage': ['#F5E9D8', '#2FA4D7', '#3E2C23', '#E76F2E'],
    'light-pink': ['#F13E93', '#F891BB', '#F9D0CD', '#FAFFCB'],
    'dark-cyber': ['#090040', '#471396', '#B13BFF', '#FFCC00'],
    'dark-matrix': ['#0D0208', '#003B00', '#008F11', '#00FF41'],
    'dark-neon': ['#000957', '#344CB7', '#577BC1', '#FFEB00'],
    'dark-blue': ['#1B262C', '#0F4C75', '#3282B8', '#BBE1FA'],
}

export const DEFAULT_THEME = 'dark-cyber'

function isKnownTheme(themeId) {
    return THEME_OPTIONS.some((theme) => theme.id === themeId)
}

export function getSavedTheme() {
    if (typeof window === 'undefined') return DEFAULT_THEME
    const raw = localStorage.getItem(THEME_KEY)
    if (!raw || !isKnownTheme(raw)) return DEFAULT_THEME
    return raw
}

export function applyTheme(themeId) {
    if (typeof document === 'undefined') return DEFAULT_THEME
    const resolved = isKnownTheme(themeId) ? themeId : DEFAULT_THEME
    document.documentElement.setAttribute('data-theme', resolved)
    if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, resolved)
    }
    return resolved
}

export function applySavedTheme() {
    return applyTheme(getSavedTheme())
}

export function getThemeSwatches(themeId) {
    return THEME_SWATCHES[themeId] || THEME_SWATCHES[DEFAULT_THEME]
}
