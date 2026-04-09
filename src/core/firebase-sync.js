import {
  ANALYTICS_KEY,
  DECK_STATS_KEY,
  MASTERY_PEAK_KEY,
  notifyStatsUpdated,
} from './analytics'
import {
  DECK_EDITS_KEY,
  DECK_IMAGES_KEY,
  DECK_ICONS_KEY,
} from './deck-loader'
import { readJson, writeJson } from './storage'
import {
  loadUserData,
  saveUserData,
} from './firebase-auth'

const ACTIVITY_LOG_KEY = 'activityLog_v1'
const DRILL_RECORDS_KEY = 'drillRecords_v1'

function sumAttemptsInDeckStats(deckStats) {
  return Object.values(deckStats || {}).reduce((acc, item) => acc + Number(item?.attempts || 0), 0)
}

function mergeAnalytics(localAnalytics, cloudAnalytics) {
  const merged = {}
  const decks = new Set([...Object.keys(localAnalytics || {}), ...Object.keys(cloudAnalytics || {})])

  for (const deck of decks) {
    const localDeck = localAnalytics?.[deck] || {}
    const cloudDeck = cloudAnalytics?.[deck] || {}
    const localAttempts = Number(localDeck.totalAttempts || 0)
    const cloudAttempts = Number(cloudDeck.totalAttempts || 0)
    merged[deck] = cloudAttempts >= localAttempts ? cloudDeck : localDeck
  }

  return merged
}

function mergeDeckStats(localDeckStats, cloudDeckStats) {
  const merged = {}
  const decks = new Set([...Object.keys(localDeckStats || {}), ...Object.keys(cloudDeckStats || {})])

  for (const deck of decks) {
    const localDeck = localDeckStats?.[deck] || {}
    const cloudDeck = cloudDeckStats?.[deck] || {}
    const localAttempts = sumAttemptsInDeckStats(localDeck)
    const cloudAttempts = sumAttemptsInDeckStats(cloudDeck)
    merged[deck] = cloudAttempts >= localAttempts ? cloudDeck : localDeck
  }

  return merged
}

function mergeMasteryPeaks(localPeaks, cloudPeaks) {
  const merged = {}
  const decks = new Set([...Object.keys(localPeaks || {}), ...Object.keys(cloudPeaks || {})])

  for (const deck of decks) {
    merged[deck] = Math.max(Number(localPeaks?.[deck] || 0), Number(cloudPeaks?.[deck] || 0))
  }

  return merged
}

function mergeActivityLog(localLog, cloudLog) {
  const merged = { ...(cloudLog || {}) }
  const local = localLog || {}

  for (const [date, day] of Object.entries(local)) {
    const cloudDay = merged[date] || {}
    merged[date] = {
      drills: Math.max(Number(cloudDay.drills || 0), Number(day?.drills || 0)),
      sessions: Math.max(Number(cloudDay.sessions || 0), Number(day?.sessions || 0)),
      attempts: Math.max(Number(cloudDay.attempts || 0), Number(day?.attempts || 0)),
    }
  }

  return merged
}

function mergeDrillRecords(localRecords, cloudRecords) {
  const merged = {}
  const decks = new Set([...Object.keys(localRecords || {}), ...Object.keys(cloudRecords || {})])

  for (const deck of decks) {
    const localDeck = localRecords?.[deck] || {}
    const cloudDeck = cloudRecords?.[deck] || {}
    const localDrills = Number(localDeck.totalDrills || 0)
    const cloudDrills = Number(cloudDeck.totalDrills || 0)
    merged[deck] = cloudDrills >= localDrills ? cloudDeck : localDeck
  }

  return merged
}

function mergeDeckOverrideMaps(localOverrides, cloudOverrides) {
  const merged = {}
  const local = localOverrides || {}
  const cloud = cloudOverrides || {}
  const decks = new Set([...Object.keys(local), ...Object.keys(cloud)])

  for (const deck of decks) {
    // Prefer local deck override objects so newer editor resets/changes are not resurrected from cloud.
    merged[deck] = Object.prototype.hasOwnProperty.call(local, deck) ? (local[deck] || {}) : (cloud[deck] || {})
  }

  return merged
}

export async function syncCloudForCurrentUser() {
  const [
    cloudAnalytics,
    cloudDeckStats,
    cloudMasteryPeak,
    cloudActivityLog,
    cloudDrillRecords,
    cloudDeckEdits,
    cloudDeckImages,
    cloudDeckIcons,
  ] = await Promise.all([
    loadUserData('analytics'),
    loadUserData('deckStats'),
    loadUserData('masteryPeak'),
    loadUserData('activityLog'),
    loadUserData('drillRecords'),
    loadUserData('deckEdits'),
    loadUserData('deckImages'),
    loadUserData('deckIcons'),
  ])

  const localAnalytics = readJson(ANALYTICS_KEY, {})
  const localDeckStats = readJson(DECK_STATS_KEY, {})
  const localMasteryPeak = readJson(MASTERY_PEAK_KEY, {})
  const localActivityLog = readJson(ACTIVITY_LOG_KEY, {})
  const localDrillRecords = readJson(DRILL_RECORDS_KEY, {})
  const localDeckEdits = readJson(DECK_EDITS_KEY, {})
  const localDeckImages = readJson(DECK_IMAGES_KEY, {})
  const localDeckIcons = readJson(DECK_ICONS_KEY, {})

  const mergedAnalytics = mergeAnalytics(localAnalytics, cloudAnalytics || {})
  const mergedDeckStats = mergeDeckStats(localDeckStats, cloudDeckStats || {})
  const mergedMasteryPeak = mergeMasteryPeaks(localMasteryPeak, cloudMasteryPeak || {})
  const mergedActivityLog = mergeActivityLog(localActivityLog, cloudActivityLog || {})
  const mergedDrillRecords = mergeDrillRecords(localDrillRecords, cloudDrillRecords || {})
  const mergedDeckEdits = mergeDeckOverrideMaps(localDeckEdits, cloudDeckEdits || {})
  const mergedDeckImages = mergeDeckOverrideMaps(localDeckImages, cloudDeckImages || {})
  const mergedDeckIcons = mergeDeckOverrideMaps(localDeckIcons, cloudDeckIcons || {})

  writeJson(ANALYTICS_KEY, mergedAnalytics)
  writeJson(DECK_STATS_KEY, mergedDeckStats)
  writeJson(MASTERY_PEAK_KEY, mergedMasteryPeak)
  writeJson(ACTIVITY_LOG_KEY, mergedActivityLog)
  writeJson(DRILL_RECORDS_KEY, mergedDrillRecords)
  writeJson(DECK_EDITS_KEY, mergedDeckEdits)
  writeJson(DECK_IMAGES_KEY, mergedDeckImages)
  writeJson(DECK_ICONS_KEY, mergedDeckIcons)

  notifyStatsUpdated()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mnemonic-deck-updated'))
  }

  await Promise.all([
    saveUserData('analytics', mergedAnalytics),
    saveUserData('deckStats', mergedDeckStats),
    saveUserData('masteryPeak', mergedMasteryPeak),
    saveUserData('activityLog', mergedActivityLog),
    saveUserData('drillRecords', mergedDrillRecords),
    saveUserData('deckEdits', mergedDeckEdits),
    saveUserData('deckImages', mergedDeckImages),
    saveUserData('deckIcons', mergedDeckIcons),
  ])

  return {
    analyticsDecks: Object.keys(mergedAnalytics).length,
    deckStatsDecks: Object.keys(mergedDeckStats).length,
    activityDays: Object.keys(mergedActivityLog).length,
  }
}
