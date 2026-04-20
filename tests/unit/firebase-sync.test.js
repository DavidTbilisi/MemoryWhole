import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadUserDataMock = vi.fn()
const saveUserDataMock = vi.fn()
const readJsonMock = vi.fn()
const writeJsonMock = vi.fn()
const notifyStatsUpdatedMock = vi.fn()

vi.mock('../../src/core/firebase-auth', () => ({
  loadUserData: loadUserDataMock,
  saveUserData: saveUserDataMock,
}))

vi.mock('../../src/core/storage', () => ({
  readJson: readJsonMock,
  writeJson: writeJsonMock,
}))

vi.mock('../../src/core/analytics', () => ({
  ANALYTICS_KEY: 'analytics_v1',
  DECK_STATS_KEY: 'deckStats_v1',
  MASTERY_PEAK_KEY: 'masteryPeak_v1',
  notifyStatsUpdated: notifyStatsUpdatedMock,
}))

vi.mock('../../src/core/deck-loader', () => ({
  DECK_EDITS_KEY: 'deckEdits_v1',
  DECK_IMAGES_KEY: 'deckImages_v1',
  DECK_ICONS_KEY: 'deckIcons_v1',
  DECK_SAVED_AT_KEY: 'deckSavedAt_v1',
}))

describe('syncCloudForCurrentUser', () => {
  beforeEach(() => {
    loadUserDataMock.mockReset()
    saveUserDataMock.mockReset()
    readJsonMock.mockReset()
    writeJsonMock.mockReset()
    notifyStatsUpdatedMock.mockReset()
    saveUserDataMock.mockResolvedValue(undefined)
  })

  it('keeps local deck edits when cloud has conflicting values', async () => {
    loadUserDataMock
      .mockResolvedValueOnce({ major: { totalAttempts: 1 } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ major: { '00': 'cloud phrase' }, sem3: { '1': 'cloud only' } })
      .mockResolvedValueOnce({ major: { '00': 'https://cloud-image' } })
      .mockResolvedValueOnce({ major: { '00': '☁️' } })
      .mockResolvedValueOnce({ major: 50, sem3: 2 })

    readJsonMock
      .mockReturnValueOnce({ major: { totalAttempts: 2 } })
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ major: { '00': 'local phrase' } })
      .mockReturnValueOnce({ major: { '00': 'https://local-image' } })
      .mockReturnValueOnce({ major: { '00': '🔥' } })
      .mockReturnValueOnce({ major: 200 })

    const { syncCloudForCurrentUser } = await import('../../src/core/firebase-sync')
    await syncCloudForCurrentUser()

    const writeMap = new Map(writeJsonMock.mock.calls.map(([key, value]) => [key, value]))
    expect(writeMap.get('deckEdits_v1')).toEqual({
      major: { '00': 'local phrase' },
      sem3: { '1': 'cloud only' },
    })
    expect(writeMap.get('deckImages_v1')).toEqual({
      major: { '00': 'https://local-image' },
    })
    expect(writeMap.get('deckIcons_v1')).toEqual({
      major: { '00': '🔥' },
    })

    const saveMap = new Map(saveUserDataMock.mock.calls.map(([key, value]) => [key, value]))
    expect(saveMap.get('deckEdits')).toEqual({
      major: { '00': 'local phrase' },
      sem3: { '1': 'cloud only' },
    })
    expect(saveMap.get('deckImages')).toEqual({
      major: { '00': 'https://local-image' },
    })
    expect(saveMap.get('deckIcons')).toEqual({
      major: { '00': '🔥' },
    })
  })

  it('preserves explicit local empty deck to prevent cloud resurrection', async () => {
    loadUserDataMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ major: { '00': 'cloud phrase' } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    readJsonMock
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ major: {} })
      .mockReturnValueOnce({})
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ major: 1 })

    const { syncCloudForCurrentUser } = await import('../../src/core/firebase-sync')
    await syncCloudForCurrentUser()

    const writeMap = new Map(writeJsonMock.mock.calls.map(([key, value]) => [key, value]))
    expect(writeMap.get('deckEdits_v1')).toEqual({ major: {} })
  })
})
