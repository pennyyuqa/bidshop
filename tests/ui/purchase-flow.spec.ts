import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';

test('should complete the purchase flow', async ({ page, request }) => {
  const email = `user_${Date.now()}@example.com`;
  const password = 'secret1';

  // Prepare an existing user through API
  await request.post(`${API_BASE_URL}/auth/register`, {
    data: {          
      email,
      password,
      name: 'Test User',
    },
  });

  // Login
  await page.goto('/login');

  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('nav-user-name')).toContainText('Test');

  // Browse products and add one to cart
  const firstProduct = page.locator('[data-testid^="product-card-"]').first();
  await expect(firstProduct).toBeVisible();

  const addButton = firstProduct.locator('[data-testid^="product-add-"]');
  await addButton.click();

  await expect(page.getByTestId('nav-cart-count')).toHaveText('1');

  // Go to cart
  await page.getByTestId('nav-cart').click();

  await expect(page.getByTestId('cart-table')).toBeVisible();

  // Checkout
  await page.getByTestId('cart-checkout').click();

  await page.getByTestId('checkout-address').fill('1 Queen Street');
  await page.getByTestId('checkout-city').fill('Auckland');
  await page.getByTestId('checkout-postcode').fill('1010');

  await page.getByTestId('checkout-submit').click();

  // Verify order confirmation
  await expect(page.getByTestId('order-confirmation')).toBeVisible();
  await expect(page.getByTestId('order-id')).toBeVisible();
});