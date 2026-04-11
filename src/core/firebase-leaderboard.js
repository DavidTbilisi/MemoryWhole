import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { getDailyStreak } from './analytics'
import { getCurrentUser, getFirestoreDb } from './firebase-auth'
import { getLeaderboardSnapshot } from './ranking'

const LEADERBOARD_COLLECTION = 'leaderboard'

function initialsFromName(value) {
  const source = String(value || '').trim()
  if (!source) return 'AN'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  }
  const compact = source.replace(/[^a-zA-Z0-9]/g, '')
  return (compact.slice(0, 2) || 'AN').toUpperCase()
}

function fallbackName(user) {
  if (!user) return 'Anonymous'
  const displayName = String(user.displayName || '').trim()
  if (displayName) return initialsFromName(displayName)
  const email = String(user.email || '').trim()
  if (!email) return 'AN'
  return initialsFromName(email.split('@')[0] || email)
}

function toEntry(id, value = {}) {
  return {
    uid: id,
    displayName: String(value.displayName || 'Anonymous'),
    photoURL: String(value.photoURL || ''),
    globalScore: Number(value.globalScore || 0),
    globalRank: String(value.globalRank || 'F'),
    globalAccuracy: Number(value.globalAccuracy || 0),
    totalAttempts: Number(value.totalAttempts || 0),
    deckCount: Number(value.deckCount || 0),
    totalDeckCount: Number(value.totalDeckCount || 0),
    coveragePct: Number(value.coveragePct || 0),
    syntheticScore: Number(value.syntheticScore || 0),
    syntheticRank: String(value.syntheticRank || 'F'),
    averageMastery: Number(value.averageMastery || 0),
    diversityBonus: Number(value.diversityBonus || 0),
    recent7dGlobalScore: Number(value.recent7dGlobalScore || 0),
    recent7dGlobalAccuracy: Number(value.recent7dGlobalAccuracy || 0),
    recent7dAttempts: Number(value.recent7dAttempts || 0),
    recent7dDeckCount: Number(value.recent7dDeckCount || 0),
    recent7dCoveragePct: Number(value.recent7dCoveragePct || 0),
    recent7dSyntheticScore: Number(value.recent7dSyntheticScore || 0),
    recent7dAverageMastery: Number(value.recent7dAverageMastery || 0),
    recent7dDiversityBonus: Number(value.recent7dDiversityBonus || 0),
    deckStats: value.deckStats && typeof value.deckStats === 'object' ? value.deckStats : {},
    streakCurrent: Number(value.streakCurrent || 0),
    streakLongest: Number(value.streakLongest || 0),
    updatedAt: Number(value.updatedAt || 0),
  }
}

export async function publishLeaderboardSnapshot() {
  const user = getCurrentUser()
  if (!user) return null

  const streak = getDailyStreak()
  const snapshot = {
    uid: user.uid,
    displayName: fallbackName(user),
    photoURL: String(user.photoURL || ''),
    ...getLeaderboardSnapshot(),
    streakCurrent: Number(streak.current || 0),
    streakLongest: Number(streak.longest || 0),
    updatedAt: Date.now(),
  }

  await setDoc(doc(getFirestoreDb(), LEADERBOARD_COLLECTION, user.uid), snapshot, { merge: true })
  return snapshot
}

export async function fetchLeaderboardEntries() {
  const snap = await getDocs(collection(getFirestoreDb(), LEADERBOARD_COLLECTION))
  return snap.docs.map((item) => toEntry(item.id, item.data()))
}

export async function fetchCurrentUserLeaderboardEntry() {
  const user = getCurrentUser()
  if (!user) return null
  const snap = await getDoc(doc(getFirestoreDb(), LEADERBOARD_COLLECTION, user.uid))
  if (!snap.exists()) return null
  return toEntry(snap.id, snap.data())
}
