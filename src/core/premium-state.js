export const PREMIUM_FEATURES = Object.freeze({
  'cloud-sync': true,
  'advanced-analytics': true,
  'coach': true,
  'training-log-plus': true,
})

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

function parseCsvSet(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )
}

function toMillis(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num <= 0) return 0
  return num < 1e12 ? num * 1000 : num
}

export function getBillingReturnState(search = '') {
  const params = new URLSearchParams(String(search || ''))
  const billing = String(params.get('billing') || '').trim().toLowerCase()
  if (billing === 'success' || billing === 'cancel' || billing === 'portal') return billing
  return ''
}

export function isEntitlementPremium(raw = {}) {
  const status = String(raw.status || 'inactive').toLowerCase()
  if (ACTIVE_STATUSES.has(status)) return true
  if (status !== 'canceled') return false
  const periodEnd = toMillis(raw.currentPeriodEnd)
  return periodEnd > Date.now()
}

export function normalizeEntitlement(raw = {}, options = {}) {
  const signedIn = Boolean(options.signedIn)
  const isLoading = Boolean(options.isLoading)
  const status = String(raw.status || 'inactive').toLowerCase()
  const currentPeriodEnd = toMillis(raw.currentPeriodEnd)
  const updatedAt = toMillis(raw.updatedAt)
  const overridePremium = Boolean(options.overridePremium)
  const isAdmin = Boolean(options.isAdmin)
  const normalized = {
    signedIn,
    isLoading,
    ready: !isLoading,
    userId: String(options.userId || ''),
    email: String(options.email || '').toLowerCase(),
    status,
    isPremium: overridePremium || isEntitlementPremium({ ...raw, status, currentPeriodEnd }),
    overridePremium,
    isAdmin,
    stripeCustomerId: String(raw.stripeCustomerId || ''),
    stripeSubscriptionId: String(raw.stripeSubscriptionId || ''),
    priceId: String(raw.priceId || ''),
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd),
    updatedAt,
    billingReturn: String(options.billingReturn || ''),
    error: String(options.error || ''),
  }
  return normalized
}

export function entitlementHasFeature(entitlement, featureKey) {
  if (!PREMIUM_FEATURES[featureKey]) return false
  return Boolean(entitlement?.isPremium)
}

export function shouldSyncCloud(entitlement) {
  return entitlementHasFeature(entitlement, 'cloud-sync')
}

export function getPlanLabel(entitlement) {
  if (!entitlement?.signedIn) return 'Guest'
  if (entitlement?.isLoading) return 'Checking plan...'
  return entitlement?.isPremium ? 'Pro active' : 'Free plan'
}

export function getPlanDetail(entitlement) {
  if (!entitlement?.signedIn) return 'Sign in to unlock premium sync and analytics.'
  if (entitlement?.isLoading) return 'Loading subscription status...'
  if (entitlement?.isPremium) return 'Cloud sync and advanced analytics are unlocked.'
  return 'Core training stays free. Upgrade for sync and advanced analytics.'
}

export function getUpgradeLabel(entitlement) {
  if (entitlement?.isLoading) return 'Checking plan...'
  if (entitlement?.isAdmin) return 'Manage subscription'
  if (entitlement?.isPremium) return 'Manage subscription'
  if (entitlement?.signedIn) return 'Upgrade to Pro'
  return 'Sign in to upgrade'
}

export function isDeveloperPremiumUser({ email = '', uid = '' } = {}) {
  const emails = parseCsvSet(import.meta.env.VITE_DEV_PREMIUM_EMAILS)
  const uids = parseCsvSet(import.meta.env.VITE_DEV_PREMIUM_UIDS)
  return emails.has(String(email || '').trim().toLowerCase()) || uids.has(String(uid || '').trim().toLowerCase())
}

export function isAdminPremiumUser({ email = '', uid = '' } = {}) {
  const emails = parseCsvSet(import.meta.env.VITE_ADMIN_EMAILS)
  const uids = parseCsvSet(import.meta.env.VITE_ADMIN_UIDS)
  return emails.has(String(email || '').trim().toLowerCase()) || uids.has(String(uid || '').trim().toLowerCase())
}
