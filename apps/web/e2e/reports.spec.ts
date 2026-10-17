import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test('a stopped focus session shows up in reports', async ({ page }) => {
  test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD')

  await page.goto('/login')
  await page.locator('#email').fill(email ?? '')
  await page.locator('#password').fill(password ?? '')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/today/)

  await page.getByRole('link', { name: 'Reports' }).click()
  await expect(page.getByTestId('focus-sessions')).toBeVisible()
  const before = Number((await page.getByTestId('focus-sessions').innerText()).trim())

  const title = `E2E ${Date.now()}`
  await page.getByRole('link', { name: 'Today' }).click()
  await page.getByPlaceholder('Title  #goal  ~30m  !tomorrow').fill(title)
  await page.getByPlaceholder('Title  #goal  ~30m  !tomorrow').press('Enter')
  await page.getByLabel('Task').selectOption({ label: title })
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Stop' }).click()
  await page.getByRole('button', { name: 'Distracted' }).click()

  await page.getByRole('link', { name: 'Reports' }).click()
  await expect(page.getByTestId('focus-sessions')).toHaveText(String(before + 1))
})
