import { test, expect } from 'playwright/test'

function makeSession(ts, attempts, correct, peak = 0) {
    const wrong = attempts - correct
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0
    return {
        ts,
        attempts,
        correct,
        wrong,
        accuracy,
        mastery: accuracy,
        peak: peak || accuracy,
    }
}

function makeNumStats(attempts, correct) {
    const stats = {}
    for (let index = 0; index < attempts; index += 1) {
        const key = String(index).padStart(2, '0')
        const isCorrect = index < correct
        stats[key] = {
            attempts: 1,
            correct: isCorrect ? 1 : 0,
            wrong: isCorrect ? 0 : 1,
            totalTime: 0,
        }
    }
    return stats
}

async function assertMajorDashboardPeak(page, expectedPct) {
    const majorCard = page.getByText('Major System').locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
    await majorCard.click()

    await expect(page.getByRole('heading', { name: /Dashboard\s*[\-—]\s*major/i })).toBeVisible()

    const peakCard = page
        .getByText('Best all-time deck mastery.')
        .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    await expect(peakCard).toContainText('Peak')
    await expect(peakCard).toContainText(`${expectedPct}%`)
}

test.describe('Deck mastery recovery', () => {
    test('a clean recovery session can raise peak after an earlier mistake', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' })

        const seededPeak = await page.evaluate(() => {
            const now = Date.now()
            localStorage.clear()
            localStorage.setItem('analytics_v1', JSON.stringify({
                major: {
                    totalSessions: 2,
                    totalAttempts: 200,
                    totalCorrect: 184,
                    totalWrong: 16,
                },
            }))
            localStorage.setItem('masteryPeak_v1', JSON.stringify({ major: 92 }))
            localStorage.setItem('sessionHistory_v1', JSON.stringify({
                major: [
                    {
                        ts: now - 60_000,
                        attempts: 50,
                        correct: 46,
                        wrong: 4,
                        accuracy: 92,
                        mastery: 92,
                        peak: 92,
                    },
                    {
                        ts: now - 120_000,
                        attempts: 50,
                        correct: 46,
                        wrong: 4,
                        accuracy: 92,
                        mastery: 92,
                        peak: 92,
                    },
                ],
            }))
            return JSON.parse(localStorage.getItem('masteryPeak_v1') || '{}').major
        })

        expect(seededPeak).toBe(92)
        await page.reload({ waitUntil: 'networkidle' })

        const majorCard = page.getByText('Major System').locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
        await expect(majorCard).toContainText('92%')

        const result = await page.evaluate(async ({ history, stats }) => {
            const analyticsModule = await import('./src/core/analytics.js')

            const beforePeak = analyticsModule.getDeckPeak('major')
            const beforeMastery = analyticsModule.getDeckMastery('major')

            const recorded = analyticsModule.recordSession('major', stats)
            const afterPeak = analyticsModule.getDeckPeak('major')
            const afterMastery = analyticsModule.getDeckMastery('major')
            const savedHistory = analyticsModule.getDeckSessionHistory('major')

            return {
                beforePeak,
                beforeMastery,
                recordedPeak: recorded.peak,
                recordedMastery: recorded.mastery,
                afterPeak,
                afterMastery,
                historyLength: savedHistory.length,
                latest: savedHistory[0],
                baselineHistory: history,
            }
        }, {
            history: [
                makeSession(Date.now() - 60_000, 50, 46, 92),
                makeSession(Date.now() - 120_000, 50, 46, 92),
            ],
            stats: makeNumStats(50, 47),
        })

        expect(result.beforePeak).toBe(92)
        expect(result.beforeMastery).toBe(92)
        expect(result.recordedMastery).toBe(93)
        expect(result.recordedPeak).toBe(93)
        expect(result.afterMastery).toBe(93)
        expect(result.afterPeak).toBe(93)
        expect(result.historyLength).toBeGreaterThanOrEqual(3)
        expect(result.latest.accuracy).toBe(94)
        expect(result.latest.mastery).toBe(93)
        expect(result.latest.peak).toBe(93)

        await expect(majorCard).toContainText('93%')
        await assertMajorDashboardPeak(page, 93)
    })

    test('a mistake can lower current mastery without erasing an earned peak', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' })

        await page.evaluate(() => {
            const now = Date.now()
            localStorage.clear()
            localStorage.setItem('analytics_v1', JSON.stringify({
                major: {
                    totalSessions: 2,
                    totalAttempts: 200,
                    totalCorrect: 186,
                    totalWrong: 14,
                },
            }))
            localStorage.setItem('masteryPeak_v1', JSON.stringify({ major: 93 }))
            localStorage.setItem('sessionHistory_v1', JSON.stringify({
                major: [
                    {
                        ts: now - 60_000,
                        attempts: 50,
                        correct: 47,
                        wrong: 3,
                        accuracy: 94,
                        mastery: 93,
                        peak: 93,
                    },
                    {
                        ts: now - 120_000,
                        attempts: 50,
                        correct: 46,
                        wrong: 4,
                        accuracy: 92,
                        mastery: 93,
                        peak: 93,
                    },
                ],
            }))
        })

        await page.reload({ waitUntil: 'networkidle' })

        const majorCard = page.getByText('Major System').locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
        await expect(majorCard).toContainText('93%')

        const result = await page.evaluate(async (stats) => {
            const analyticsModule = await import('./src/core/analytics.js')

            const beforePeak = analyticsModule.getDeckPeak('major')
            const beforeMastery = analyticsModule.getDeckMastery('major')

            const recorded = analyticsModule.recordSession('major', stats)
            const afterPeak = analyticsModule.getDeckPeak('major')
            const afterMastery = analyticsModule.getDeckMastery('major')
            const savedHistory = analyticsModule.getDeckSessionHistory('major')

            return {
                beforePeak,
                beforeMastery,
                recordedPeak: recorded.peak,
                recordedMastery: recorded.mastery,
                afterPeak,
                afterMastery,
                latest: savedHistory[0],
            }
        }, makeNumStats(50, 40))

        expect(result.beforePeak).toBe(93)
        expect(result.beforeMastery).toBe(93)
        expect(result.recordedMastery).toBe(87)
        expect(result.recordedPeak).toBe(93)
        expect(result.afterMastery).toBe(87)
        expect(result.afterPeak).toBe(93)
        expect(result.latest.accuracy).toBe(80)
        expect(result.latest.mastery).toBe(87)
        expect(result.latest.peak).toBe(93)

        await expect(majorCard).toContainText('93%')
        await assertMajorDashboardPeak(page, 93)
    })
})