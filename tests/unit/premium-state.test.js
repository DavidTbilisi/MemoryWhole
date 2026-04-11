import { describe, expect, it, vi } from 'vitest'
import {
  entitlementHasFeature,
  getBillingReturnState,
  getPlanDetail,
  getPlanLabel,
  getUpgradeLabel,
  isEntitlementPremium,
  normalizeEntitlement,
  shouldSyncCloud,
} from '../../src/core/premium-state'

describe('premium-state helpers', () => {
  it('treats active subscriptions as premium', () => {
    expect(isEntitlementPremium({ status: 'active' })).toBe(true)
    expect(isEntitlementPremium({ status: 'trialing' })).toBe(true)
  })

  it('treats canceled subscriptions as premium until period end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-11T12:00:00Z'))

    expect(isEntitlementPremium({ status: 'canceled', currentPeriodEnd: Date.now() + 60_000 })).toBe(true)
    expect(isEntitlementPremium({ status: 'canceled', currentPeriodEnd: Date.now() - 60_000 })).toBe(false)

    vi.useRealTimers()
  })

  it('normalizes inactive entitlement defaults', () => {
    expect(normalizeEntitlement()).toMatchObject({
      signedIn: false,
      isLoading: false,
      status: 'inactive',
      isPremium: false,
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      priceId: '',
      cancelAtPeriodEnd: false,
    })
  })

  it('unlocks premium features only for premium users', () => {
    const free = normalizeEntitlement({}, { signedIn: true })
    const premium = normalizeEntitlement({ status: 'active' }, { signedIn: true })

    expect(entitlementHasFeature(free, 'coach')).toBe(false)
    expect(entitlementHasFeature(premium, 'coach')).toBe(true)
    expect(shouldSyncCloud(premium)).toBe(true)
  })

  it('parses billing return states from the URL', () => {
    expect(getBillingReturnState('?billing=success')).toBe('success')
    expect(getBillingReturnState('?billing=cancel')).toBe('cancel')
    expect(getBillingReturnState('?billing=portal')).toBe('portal')
    expect(getBillingReturnState('?billing=unknown')).toBe('')
  })

  it('returns plan labels and upgrade labels that match entitlement state', () => {
    const guest = normalizeEntitlement()
    const free = normalizeEntitlement({}, { signedIn: true })
    const premium = normalizeEntitlement({ status: 'active' }, { signedIn: true })

    expect(getPlanLabel(guest)).toBe('Guest')
    expect(getPlanDetail(free)).toContain('Core training')
    expect(getPlanLabel(premium)).toBe('Pro active')
    expect(getUpgradeLabel(guest)).toBe('Sign in to upgrade')
    expect(getUpgradeLabel(free)).toBe('Upgrade to Pro')
    expect(getUpgradeLabel(premium)).toBe('Manage subscription')
  })
})
