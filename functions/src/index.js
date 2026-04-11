const admin = require('firebase-admin')
const functions = require('firebase-functions/v1')
const Stripe = require('stripe')

const STRIPE_API_VERSION = '2026-02-25.clover'

admin.initializeApp()

function getEnv(name, fallback = '') {
  return String(process.env[name] || fallback || '').trim()
}

function getRequiredEnv(name) {
  const value = getEnv(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getStripeClient() {
  return new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
    apiVersion: STRIPE_API_VERSION,
  })
}

function getSubscriptionRef(uid) {
  return admin.firestore().doc(`users/${uid}/billing/subscription`)
}

function getAdminEmails() {
  return new Set(
    getEnv('ADMIN_EMAILS')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

function isAdminToken(decodedToken) {
  const email = String(decodedToken?.email || '').trim().toLowerCase()
  return !!email && getAdminEmails().has(email)
}

function toMillis(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num <= 0) return 0
  return num < 1e12 ? num * 1000 : num
}

function isPremiumStatus(status, currentPeriodEnd) {
  const normalized = String(status || 'inactive').toLowerCase()
  if (normalized === 'active' || normalized === 'trialing') return true
  if (normalized !== 'canceled') return false
  return toMillis(currentPeriodEnd) > Date.now()
}

function normalizeEntitlement(payload = {}) {
  const status = String(payload.status || 'inactive').toLowerCase()
  const currentPeriodEnd = toMillis(payload.currentPeriodEnd)
  return {
    status,
    isPremium: isPremiumStatus(status, currentPeriodEnd),
    stripeCustomerId: String(payload.stripeCustomerId || ''),
    stripeSubscriptionId: String(payload.stripeSubscriptionId || ''),
    priceId: String(payload.priceId || ''),
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(payload.cancelAtPeriodEnd),
    updatedAt: Date.now(),
  }
}

function buildReturnUrl(baseUrl, billingState) {
  const url = new URL(baseUrl)
  url.searchParams.set('billing', billingState)
  return url.toString()
}

function getAllowedOrigins() {
  const configured = getEnv('APP_BASE_URL')
  const origins = new Set()

  if (configured) {
    try {
      origins.add(new URL(configured).origin)
    } catch (_) {
      // Ignore invalid configured URL and fall back to local defaults.
    }
  }

  origins.add('http://localhost:5173')
  origins.add('http://127.0.0.1:5173')
  return origins
}

function setCors(req, res) {
  const requestOrigin = String(req.headers.origin || '')
  const allowedOrigins = getAllowedOrigins()
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.set('Access-Control-Allow-Origin', requestOrigin)
  } else {
    const firstAllowed = [...allowedOrigins][0]
    res.set('Access-Control-Allow-Origin', firstAllowed || '*')
  }
  res.set('Vary', 'Origin')
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Stripe-Signature')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

async function authenticateRequest(req) {
  const authHeader = String(req.headers.authorization || '')
  if (!authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing bearer token.'), { statusCode: 401 })
  }

  const idToken = authHeader.slice('Bearer '.length)
  return admin.auth().verifyIdToken(idToken)
}

async function ensureStripeCustomer(stripe, decodedToken) {
  const ref = getSubscriptionRef(decodedToken.uid)
  const snap = await ref.get()
  const existing = snap.exists ? snap.data() || {} : {}
  if (existing.stripeCustomerId) {
    return {
      customerId: existing.stripeCustomerId,
      entitlement: existing,
    }
  }

  const customer = await stripe.customers.create({
    email: decodedToken.email || undefined,
    name: decodedToken.name || undefined,
    metadata: {
      firebaseUID: decodedToken.uid,
    },
  })

  const entitlement = normalizeEntitlement({
    ...existing,
    stripeCustomerId: customer.id,
  })

  await ref.set(entitlement, { merge: true })

  return {
    customerId: customer.id,
    entitlement,
  }
}

async function resolveUserForGrant({ email = '', uid = '' } = {}) {
  const normalizedUid = String(uid || '').trim()
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (normalizedUid) {
    return admin.auth().getUser(normalizedUid)
  }
  if (normalizedEmail) {
    return admin.auth().getUserByEmail(normalizedEmail)
  }

  const error = new Error('Provide a target email or uid.')
  error.statusCode = 400
  error.code = 'missing-target'
  throw error
}

async function writeEntitlementFromSubscription(subscriptionId, customerIdOverride = '') {
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = String(customerIdOverride || subscription.customer || '')
  const firebaseUID = String(subscription.metadata?.firebaseUID || '')

  if (!firebaseUID) {
    throw new Error(`Subscription ${subscriptionId} is missing firebaseUID metadata.`)
  }

  const entitlement = normalizeEntitlement({
    status: subscription.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    priceId: subscription.items?.data?.[0]?.price?.id || '',
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })

  await getSubscriptionRef(firebaseUID).set(entitlement, { merge: true })
  return entitlement
}

async function grantManualPremiumAccess({ targetUser, grantedBy = '', months = 12 } = {}) {
  const durationMonths = Math.max(1, Number(months || 12))
  const now = Date.now()
  const currentPeriodEnd = now + (durationMonths * 30 * 24 * 60 * 60 * 1000)
  const entitlement = normalizeEntitlement({
    status: 'active',
    stripeCustomerId: 'manual-grant',
    stripeSubscriptionId: `manual-grant:${grantedBy || 'admin'}`,
    priceId: getEnv('STRIPE_PRO_MONTHLY_PRICE_ID') || 'manual-grant',
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
  })

  await getSubscriptionRef(targetUser.uid).set({
    ...entitlement,
    grantedBy: String(grantedBy || ''),
    manualGrant: true,
    targetEmail: String(targetUser.email || '').toLowerCase(),
  }, { merge: true })

  return entitlement
}

function withHttpError(res, error) {
  const statusCode = Number(error?.statusCode || 500)
  res.status(statusCode).json({
    error: error?.message || 'Unexpected server error.',
    code: error?.code || 'server-error',
  })
}

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const decodedToken = await authenticateRequest(req)
    const stripe = getStripeClient()
    const { customerId, entitlement } = await ensureStripeCustomer(stripe, decodedToken)

    if (entitlement?.isPremium) {
      return res.status(409).json({
        error: 'This account already has an active Pro subscription.',
        code: 'already-premium',
      })
    }

    const returnUrl = String(req.body?.returnUrl || getRequiredEnv('APP_BASE_URL'))
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: getRequiredEnv('STRIPE_PRO_MONTHLY_PRICE_ID'),
          quantity: 1,
        },
      ],
      success_url: buildReturnUrl(returnUrl, 'success'),
      cancel_url: buildReturnUrl(returnUrl, 'cancel'),
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        firebaseUID: decodedToken.uid,
      },
      subscription_data: {
        metadata: {
          firebaseUID: decodedToken.uid,
        },
      },
    })

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      publishableKey: getEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
    })
  } catch (error) {
    return withHttpError(res, error)
  }
})

exports.grantPremiumAccess = functions.https.onRequest(async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const decodedToken = await authenticateRequest(req)
    if (!isAdminToken(decodedToken)) {
      const error = new Error('Admin access is required.')
      error.statusCode = 403
      error.code = 'admin-required'
      throw error
    }

    const targetUser = await resolveUserForGrant({
      email: req.body?.email,
      uid: req.body?.uid,
    })

    const entitlement = await grantManualPremiumAccess({
      targetUser,
      grantedBy: decodedToken.email || decodedToken.uid,
      months: req.body?.months,
    })

    return res.status(200).json({
      ok: true,
      uid: targetUser.uid,
      email: targetUser.email || '',
      entitlement,
    })
  } catch (error) {
    return withHttpError(res, error)
  }
})

exports.createPortalSession = functions.https.onRequest(async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const decodedToken = await authenticateRequest(req)
    const stripe = getStripeClient()
    const snap = await getSubscriptionRef(decodedToken.uid).get()
    const entitlement = snap.exists ? snap.data() || {} : {}
    if (!entitlement.stripeCustomerId) {
      const error = new Error('No Stripe customer exists for this account yet.')
      error.statusCode = 409
      error.code = 'customer-missing'
      throw error
    }

    const returnUrl = String(req.body?.returnUrl || getRequiredEnv('APP_BASE_URL'))
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlement.stripeCustomerId,
      return_url: buildReturnUrl(returnUrl, 'portal'),
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    return withHttpError(res, error)
  }
})

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const stripe = getStripeClient()
    const signature = req.headers['stripe-signature']
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
    const event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.subscription) {
          await writeEntitlementFromSubscription(session.subscription, session.customer)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await writeEntitlementFromSubscription(subscription.id, subscription.customer)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (invoice.subscription) {
          await writeEntitlementFromSubscription(invoice.subscription, invoice.customer)
        }
        break
      }
      default:
        break
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    functions.logger.error('Stripe webhook failed', error)
    return withHttpError(res, error)
  }
})
