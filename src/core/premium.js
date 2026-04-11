import { doc, onSnapshot } from 'firebase/firestore'
import {
  getBillingReturnState,
  getUpgradeLabel,
  normalizeEntitlement,
  entitlementHasFeature,
  isAdminPremiumUser,
  isDeveloperPremiumUser,
  shouldSyncCloud,
} from './premium-state'
import {
  getCurrentUser,
  getFirestoreDb,
  getFirebaseProjectId,
  onAuthUserChanged,
} from './firebase-auth'

const listeners = new Set()
let initialized = false
let stopAuthListener = null
let stopEntitlementListener = null
let currentEntitlement = normalizeEntitlement()
let currentUserIdentity = { uid: '', email: '' }

function emit() {
  const snapshot = getPremiumSnapshot()
  listeners.forEach((listener) => listener(snapshot))
}

function setEntitlement(nextState) {
  currentEntitlement = Object.freeze({ ...nextState })
  emit()
}

function resetEntitlement() {
  if (typeof stopEntitlementListener === 'function') {
    stopEntitlementListener()
    stopEntitlementListener = null
  }
  setEntitlement(
    normalizeEntitlement({}, {
      signedIn: false,
      isLoading: false,
      billingReturn: typeof window !== 'undefined' ? getBillingReturnState(window.location.search) : '',
      email: '',
    }),
  )
}

function watchEntitlementForUser(user) {
  if (typeof stopEntitlementListener === 'function') {
    stopEntitlementListener()
    stopEntitlementListener = null
  }

  if (!user) {
    resetEntitlement()
    return
  }

  const billingReturn = typeof window !== 'undefined' ? getBillingReturnState(window.location.search) : ''
  const identity = {
    uid: String(user.uid || ''),
    email: String(user.email || '').trim().toLowerCase(),
  }
  currentUserIdentity = identity
  setEntitlement(
    normalizeEntitlement({}, {
      signedIn: true,
      userId: user.uid,
      email: identity.email,
      isLoading: true,
      billingReturn,
      overridePremium: isDeveloperPremiumUser(identity),
      isAdmin: isAdminPremiumUser(identity),
    }),
  )

  stopEntitlementListener = onSnapshot(
    doc(getFirestoreDb(), 'users', user.uid, 'billing', 'subscription'),
    (snapshot) => {
      setEntitlement(
        normalizeEntitlement(snapshot.data() || {}, {
          signedIn: true,
          userId: user.uid,
          email: identity.email,
          isLoading: false,
          billingReturn,
          overridePremium: isDeveloperPremiumUser(identity),
          isAdmin: isAdminPremiumUser(identity),
        }),
      )
    },
    (error) => {
      setEntitlement(
        normalizeEntitlement({}, {
          signedIn: true,
          userId: user.uid,
          email: identity.email,
          isLoading: false,
          billingReturn,
          error: error?.message || 'Unable to load subscription state.',
          overridePremium: isDeveloperPremiumUser(identity),
          isAdmin: isAdminPremiumUser(identity),
        }),
      )
    },
  )
}

function ensureInitialized() {
  if (initialized) return
  initialized = true
  stopAuthListener = onAuthUserChanged((user) => {
    if (!user) {
      currentUserIdentity = { uid: '', email: '' }
    }
    watchEntitlementForUser(user)
  })
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function getPremiumApiBase() {
  const envBase = trimTrailingSlash(import.meta.env.VITE_PREMIUM_API_BASE)
  if (envBase) return envBase
  const projectId = getFirebaseProjectId()
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net` : ''
}

function getReturnUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}`
}

async function callPremiumEndpoint(endpoint, body = {}) {
  const user = getCurrentUser()
  if (!user) {
    const error = new Error('Sign in is required before purchasing premium.')
    error.code = 'auth-required'
    throw error
  }

  const apiBase = getPremiumApiBase()
  if (!apiBase) {
    const error = new Error('Premium API is not configured. Set VITE_PREMIUM_API_BASE or Firebase project settings.')
    error.code = 'config-missing'
    throw error
  }

  const token = await user.getIdToken()
  const response = await fetch(`${apiBase}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || `Premium request failed (${response.status}).`)
    error.code = payload.code || 'premium-request-failed'
    error.status = response.status
    throw error
  }

  return payload
}

export function getPremiumSnapshot() {
  return currentEntitlement
}

export function subscribeToEntitlement(callback) {
  ensureInitialized()
  listeners.add(callback)
  callback(getPremiumSnapshot())
  return () => {
    listeners.delete(callback)
  }
}

export function hasFeature(featureKey) {
  return entitlementHasFeature(currentEntitlement, featureKey)
}

export async function startCheckout() {
  const payload = await callPremiumEndpoint('createCheckoutSession', {
    returnUrl: getReturnUrl(),
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  })
  if (payload?.url && typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
  return payload
}

export async function startCheckoutFlow({ signIn } = {}) {
  if (!getCurrentUser() && typeof signIn === 'function') {
    await signIn()
  }
  return startCheckout()
}

export async function openBillingPortal() {
  const payload = await callPremiumEndpoint('createPortalSession', {
    returnUrl: getReturnUrl(),
  })
  if (payload?.url && typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
  return payload
}

export async function grantPremiumAccess({ email = '', uid = '', months = 12 } = {}) {
  return callPremiumEndpoint('grantPremiumAccess', {
    email,
    uid,
    months,
  })
}

export {
  entitlementHasFeature,
  getUpgradeLabel,
  shouldSyncCloud,
}
