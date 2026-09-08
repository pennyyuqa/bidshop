import { test, expect } from '@playwright/test';

test('displays the minimum viable product catalogue', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();

  await expect(page.getByTestId('navbar')).toBeVisible();
  await expect(page.getByTestId('nav-home')).toContainText('Bidshop');
  await expect(page.getByTestId('product-grid')).toBeVisible();
  await expect(
    page.locator('[data-testid^="product-card-"]').first(),
  ).toBeVisible();
  await expect(page.getByTestId('product-card-p-001')).toBeVisible();
  await expect(page.getByTestId('product-name-p-001')).toHaveText(
    'NZ Grass-Fed Beef Mince',
  );
  await expect(page.getByTestId('filter-summary')).not.toContainText('Error:');
  expect(pageErrors).toEqual([]);
});
