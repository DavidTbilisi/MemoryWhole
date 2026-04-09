import { beforeEach, describe, expect, it, vi } from 'vitest'

const { readJsonMock } = vi.hoisted(() => ({
    readJsonMock: vi.fn(),
}))

vi.mock('../../src/core/storage', () => ({
    readJson: readJsonMock,
}))

vi.mock('../../src/core/analytics', () => ({
    ANALYTICS_KEY: 'analytics_v1',
    MASTERY_PEAK_KEY: 'masteryPeak_v1',
}))

vi.mock('../../src/data/decks', () => ({
    DECKS: [
        { deck: 'major' },
        { deck: 'sem3' },
        { deck: 'binary' },
        { deck: 'hex' },
        { deck: 'pao' },
    ],
}))

import { getAllRankInfo, getGlobalRank, getSyntheticRank } from '../../src/core/ranking'

function seedStorage({ analytics = {}, peaks = {} } = {}) {
    readJsonMock.mockImplementation((key, fallback) => {
        if (key === 'analytics_v1') return analytics
        if (key === 'masteryPeak_v1') return peaks
        return fallback
    })
}

describe('ranking model', () => {
    beforeEach(() => {
        readJsonMock.mockReset()
    })

    it('returns baseline ranks when no progress exists', () => {
        seedStorage()

        const global = getGlobalRank()
        const synthetic = getSyntheticRank()

        expect(global.rank).toBe('D')
        expect(global.score).toBe(0)
        expect(synthetic.rank).toBe('D')
        expect(synthetic.score).toBe(0)
    })

    it('does not give SSS+ global rank for one perfect deck when coverage is low', () => {
        seedStorage({
            analytics: {
                major: { totalAttempts: 200, totalCorrect: 200 },
            },
            peaks: {
                major: 100,
            },
        })

        const global = getGlobalRank()

        expect(global.stats.globalAccuracy).toBe(100)
        expect(global.stats.coveragePct).toBe(20)
        expect(global.score).toBe(20)
        expect(global.rank).toBe('D')
        expect(global.nextRank?.rank).toBe('C')
        expect(global.coverageDecksNeeded).toBeGreaterThan(0)
        expect(global.perfectNeeded).toBeNull()
    })

    it('computes next-rank perfect answers for global rank when coverage is sufficient', () => {
        seedStorage({
            analytics: {
                major: { totalAttempts: 100, totalCorrect: 84 },
                sem3: { totalAttempts: 100, totalCorrect: 84 },
                binary: { totalAttempts: 100, totalCorrect: 84 },
                hex: { totalAttempts: 100, totalCorrect: 84 },
                pao: { totalAttempts: 100, totalCorrect: 84 },
            },
            peaks: {
                major: 84,
                sem3: 84,
                binary: 84,
                hex: 84,
                pao: 84,
            },
        })

        const global = getGlobalRank()

        expect(global.score).toBe(84)
        expect(global.rank).toBe('S+')
        expect(global.nextRank?.rank).toBe('SS')
        expect(global.nextRank?.minScore).toBe(86)
        expect(global.perfectNeeded).toBe(72)
        expect(global.coverageDecksNeeded).toBe(0)
    })

    it('computes synthetic components from mastery, accuracy, and diversity bonus', () => {
        seedStorage({
            analytics: {
                sem3: { totalAttempts: 100, totalCorrect: 50 },
            },
            peaks: {
                sem3: 80,
            },
        })

        const synthetic = getSyntheticRank()

        expect(synthetic.score).toBe(70)
        expect(synthetic.rank).toBe('A')
        expect(synthetic.components.accuracy).toBe(50)
        expect(synthetic.components.averageMastery).toBe(80)
        expect(synthetic.components.diversityBonus).toBe(2)
        expect(synthetic.components.weightedMastery).toBe(48)
        expect(synthetic.components.weightedAccuracy).toBe(20)
    })

    it('caps synthetic score at 100 and applies max diversity bonus', () => {
        seedStorage({
            analytics: {
                a: { totalAttempts: 10, totalCorrect: 10 },
                b: { totalAttempts: 10, totalCorrect: 10 },
                c: { totalAttempts: 10, totalCorrect: 10 },
                d: { totalAttempts: 10, totalCorrect: 10 },
                e: { totalAttempts: 10, totalCorrect: 10 },
                f: { totalAttempts: 10, totalCorrect: 10 },
            },
            peaks: {
                a: 100,
                b: 100,
                c: 100,
                d: 100,
                e: 100,
                f: 100,
            },
        })

        const all = getAllRankInfo()

        expect(all.synthetic.score).toBe(100)
        expect(all.synthetic.rank).toBe('SSS+')
        expect(all.synthetic.components.diversityBonus).toBe(10)
    })
})
