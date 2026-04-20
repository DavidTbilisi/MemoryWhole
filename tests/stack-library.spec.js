import { test, expect } from 'playwright/test'

test.describe('Stack library', () => {
  test('opens hub from sidebar and starts stack fundamentals drill', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Stack library' }).first().click()
    await expect(page.locator('#stack-library')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Stack library' })).toBeVisible()
    await expect(page.getByText('Map & path')).toBeVisible()

    await page.getByTestId('stack-start-drill').filter({ hasText: 'Stack fundamentals' }).first().click()
    await expect(page.locator('#quiz-config')).toBeVisible()
    await page.locator('#quiz-config').getByRole('button', { name: '▶ Start Quiz' }).first().click()
    await expect(page.getByTestId('stack-ref-toggle').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 })
  })
})
