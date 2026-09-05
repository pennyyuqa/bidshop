import { test, expect } from '@playwright/test';

test('should display the product catalogue', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('products')).toBeVisible();
});
