import { test, expect } from 'playwright/test'

test.describe('CAST deck', () => {
  test('quiz config lists CAST subset groups', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('.deck-card').filter({ hasText: 'CAST edges' }).getByRole('button', { name: /Start Quiz/i }).click()
    await expect(page.locator('#quiz-config')).toBeVisible()
    const groupButtons = page.locator('#quiz-config .mb-6.grid button')
    await expect(groupButtons.first()).toBeVisible()
    const n = await groupButtons.count()
    expect(n).toBeGreaterThanOrEqual(6)
  })

  test('CAST quiz session and help drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('.deck-card').filter({ hasText: 'CAST edges' }).getByRole('button', { name: /Start Quiz/i }).click()
    await expect(page.locator('#quiz-config')).toBeVisible()
    await page.locator('#quiz-config').getByRole('button', { name: '▶ Start Quiz' }).first().click()

    const refBtn = page.getByTestId('stack-ref-toggle').filter({ visible: true }).first()
    await expect(refBtn).toBeVisible({ timeout: 15000 })
    await refBtn.click()
    await expect(page.getByTestId('stack-ref-drawer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CAST reference' })).toBeVisible()
    await expect(page.getByText('Character (AB)')).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByTestId('stack-ref-drawer')).toBeHidden()

    await page.locator('.quiz-container .flex-1.grid.grid-cols-2 button').first().click()
    await expect(page.locator('.quiz-feedback-correct, .quiz-feedback-wrong')).toBeVisible({ timeout: 5000 })
  })
})
