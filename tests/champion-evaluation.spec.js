import { test, expect } from 'playwright/test'

const BASE = 'http://127.0.0.1:5174/MemoryWhole/'

async function launchChampionCompetition(page, { itemCount = 10, studySpeedSec = 2 } = {}) {
  await page.getByRole('button', { name: /View full evaluation/i }).click()
  await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

  const invoked = await page.evaluate(({ count, speed }) => {
    const app = document.querySelector('#app')?.__vue_app__
    const vm = app?._instance?.proxy
    if (!vm || typeof vm.launchChampionGoal !== 'function') return false
    vm.launchChampionGoal({
      type: 'competition',
      deck: 'major',
      config: { itemCount: count, studySpeedSec: speed },
    })
    return true
  }, { count: itemCount, speed: studySpeedSec })

  expect(invoked).toBe(true)
  await expect(page.getByText('STUDY PHASE')).toBeVisible({ timeout: 7000 })
}

async function launchChampionDrill(page, { durationSec = 10 } = {}) {
  await page.getByRole('button', { name: /View full evaluation/i }).click()
  await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

  const invoked = await page.evaluate(({ duration }) => {
    const app = document.querySelector('#app')?.__vue_app__
    const vm = app?._instance?.proxy
    if (!vm || typeof vm.launchChampionGoal !== 'function') return false
    vm.launchChampionGoal({
      type: 'drill',
      deck: 'major',
      config: { durationSec: duration },
    })
    return true
  }, { duration: durationSec })

  expect(invoked).toBe(true)
  await page.waitForFunction(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const vm = app?._instance?.proxy
    return Boolean(vm?.$refs?.quizView)
  }, null, { timeout: 7000 })
}

async function finishDrillFromApp(page) {
  const finished = await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const vm = app?._instance?.proxy
    const quiz = vm?.$refs?.quizView
    if (!quiz || typeof quiz.finish !== 'function') return false
    quiz.finish('e2e')
    return true
  })
  expect(finished).toBe(true)
  await page.waitForTimeout(350)
}

async function completeCompetitionFast(page, { itemCount = 10, studySpeedSec = 2 } = {}) {
  const totalStudyMs = (itemCount * studySpeedSec * 1000) + 1000
  for (let i = 0; i < 3; i += 1) {
    if (await page.getByText('RECALL PHASE').isVisible()) break
    await page.clock.runFor(totalStudyMs)
  }
  await expect(page.getByText('RECALL PHASE')).toBeVisible({ timeout: 7000 })

  for (let i = 0; i < itemCount; i += 1) {
    const buttons = page.locator('.grid button:not([disabled])')
    await buttons.first().waitFor({ state: 'visible', timeout: 3000 })
    await buttons.first().click()
    await page.waitForTimeout(360)
  }

  await expect(page.getByRole('heading', { name: 'Competition Results' })).toBeVisible({ timeout: 7000 })
}

test.describe('Champion Evaluation', () => {
  test('side nav entry opens Champion Evaluation', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /Champion Eval/i }).first().click()
    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

    const view = await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      return app?._instance?.proxy?.view || null
    })
    expect(view).toBe('champion-evaluation')
  })

  test('home keyboard E opens Champion Evaluation', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await expect(page.getByText('Champion Track')).toBeVisible()

    await page.keyboard.press('e')
    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

    const view = await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      return app?._instance?.proxy?.view || null
    })
    expect(view).toBe('champion-evaluation')
  })

  test('home teaser opens evaluation dashboard', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    await expect(page.getByText('Champion Track')).toBeVisible()
    await page.getByRole('button', { name: /View full evaluation/i }).click()

    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()
    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()
    await expect(page.getByText('DIMENSION PROGRESS')).toBeVisible()
  })

  test('deep-start launch uses provided competition config', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    await launchChampionCompetition(page, { itemCount: 20, studySpeedSec: 5 })

    await expect(page.getByText(/Card 1 of 20/)).toBeVisible()
    await expect(page.getByText(/5s per card/)).toBeVisible()
  })

  test('completion updates evaluationSnapshots_v1', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.clock.install()
    await launchChampionCompetition(page, { itemCount: 10, studySpeedSec: 2 })
    await completeCompetitionFast(page, { itemCount: 10, studySpeedSec: 2 })

    const snapshotCheck = await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10)
      const raw = localStorage.getItem('evaluationSnapshots_v1')
      const arr = raw ? JSON.parse(raw) : []
      const hasToday = Array.isArray(arr) && arr.some((row) => row?.date === today)
      const latest = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null
      return {
        count: Array.isArray(arr) ? arr.length : 0,
        hasToday,
        hasTierIndex: latest && Number.isFinite(Number(latest.tierIndex)),
      }
    })

    expect(snapshotCheck.count).toBeGreaterThan(0)
    expect(snapshotCheck.hasToday).toBe(true)
    expect(snapshotCheck.hasTierIndex).toBe(true)
  })

  test('drill path updates evaluationSnapshots_v1', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    const before = await page.evaluate(() => {
      const raw = localStorage.getItem('evaluationSnapshots_v1')
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr.length : 0
    })

    await launchChampionDrill(page, { durationSec: 10 })

    const finished = await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      const vm = app?._instance?.proxy
      const quiz = vm?.$refs?.quizView
      if (!quiz || typeof quiz.finish !== 'function') return false
      quiz.finish('e2e')
      return true
    })
    expect(finished).toBe(true)

    await page.waitForTimeout(350)

    const after = await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10)
      const raw = localStorage.getItem('evaluationSnapshots_v1')
      const arr = raw ? JSON.parse(raw) : []
      return {
        count: Array.isArray(arr) ? arr.length : 0,
        hasToday: Array.isArray(arr) && arr.some((row) => row?.date === today),
      }
    })

    expect(after.count).toBeGreaterThanOrEqual(before)
    expect(after.hasToday).toBe(true)
  })

  test('champion selector can switch profiles', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /View full evaluation/i }).click()
    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

    const dropdown = page.locator('select').first()
    await dropdown.selectOption({ value: 'alex_mullen' })

    const selected = await dropdown.inputValue()
    expect(selected).toBe('alex_mullen')
  })

  test('bottleneck action starts a focused training block', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /View full evaluation/i }).click()
    await expect(page.getByText('BOTTLENECK ANALYSIS')).toBeVisible()

    await page.getByRole('button', { name: 'Start Focus Block' }).click()

    await page.waitForFunction(() => {
      const app = document.querySelector('#app')?.__vue_app__
      const view = app?._instance?.proxy?.view
      return view && view !== 'champion-evaluation'
    }, null, { timeout: 7000 })

    const view = await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      return app?._instance?.proxy?.view || null
    })
    expect(view).not.toBe('champion-evaluation')
  })

  test('same-day snapshot gets replaced not duplicated', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      localStorage.clear()
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem('evaluationSnapshots_v1', JSON.stringify([
        { date: today, tierIndex: 1, drillMs: 3000, acc2s: 10, acc3s: 20, acc5s: 30, volume: 5, mastery: 10, retention: 20 },
      ]))
    })

    await launchChampionDrill(page, { durationSec: 10 })
    await finishDrillFromApp(page)

    const result = await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10)
      const raw = localStorage.getItem('evaluationSnapshots_v1')
      const arr = raw ? JSON.parse(raw) : []
      const todays = Array.isArray(arr) ? arr.filter((row) => row?.date === today) : []
      return {
        total: Array.isArray(arr) ? arr.length : 0,
        todaysCount: todays.length,
      }
    })

    expect(result.total).toBe(1)
    expect(result.todaysCount).toBe(1)
  })

  test('snapshot store is capped at 90 entries', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      localStorage.clear()
      const DAY_MS = 24 * 60 * 60 * 1000
      const base = new Date('2025-01-01T00:00:00').getTime()
      const rows = []
      for (let i = 0; i < 95; i += 1) {
        const d = new Date(base + (i * DAY_MS)).toISOString().slice(0, 10)
        rows.push({ date: d, tierIndex: 0, drillMs: 0, acc2s: 0, acc3s: 0, acc5s: 0, volume: 0, mastery: 0, retention: 0 })
      }
      localStorage.setItem('evaluationSnapshots_v1', JSON.stringify(rows))
    })

    await launchChampionDrill(page, { durationSec: 10 })
    await finishDrillFromApp(page)

    const result = await page.evaluate(() => {
      const raw = localStorage.getItem('evaluationSnapshots_v1')
      const arr = raw ? JSON.parse(raw) : []
      return {
        total: Array.isArray(arr) ? arr.length : 0,
      }
    })

    expect(result.total).toBeLessThanOrEqual(90)
  })

  test('hash route restores champion evaluation view', async ({ page }) => {
    await page.goto(`${BASE}#champion-evaluation`, { waitUntil: 'networkidle' })
    await expect(page.getByText('CHAMPION COMPARISON RADAR')).toBeVisible()

    const view = await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      return app?._instance?.proxy?.view || null
    })
    expect(view).toBe('champion-evaluation')
  })
})
