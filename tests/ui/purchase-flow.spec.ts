import { test, expect } from '@playwright/test';
import { createAuthenticatedUser } from '../auth-helper';

test('customer can buy a known product and receives an accurate confirmation', async ({
  page,
  request,
}) => {
  const { email, password } = await createAuthenticatedUser(request);
  const productId = 'p-001';
  const productName = 'NZ Grass-Fed Beef Mince';

  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('nav-user-name')).toContainText('Test');

  const productCard = page.getByTestId(`product-card-${productId}`);
  await expect(productCard).toBeVisible();
  await expect(page.getByTestId(`product-name-${productId}`)).toHaveText(
    productName,
  );
  await expect(page.getByTestId(`product-price-${productId}`)).toHaveText(
    '$14.50',
  );

  await page.getByTestId(`product-add-${productId}`).click();
  await expect(page.getByTestId('nav-cart-count')).toHaveText('1');

  await page.getByTestId('nav-cart').click();
  const cartRow = page.getByTestId(`cart-row-${productId}`);
  await expect(cartRow).toBeVisible();
  await page.getByTestId(`cart-qty-${productId}`).fill('2');
  await expect(page.getByTestId('nav-cart-count')).toHaveText('2');

  await expect(page.getByTestId(`cart-name-${productId}`)).toHaveText(
    productName,
  );
  await expect(page.getByTestId(`cart-unit-price-${productId}`)).toHaveText(
    '$14.50',
  );
  await expect(page.getByTestId(`cart-qty-${productId}`)).toHaveValue('2');
  await expect(page.getByTestId(`cart-line-total-${productId}`)).toHaveText(
    '$29.00',
  );
  await expect(page.getByTestId('cart-subtotal')).toHaveText('$29.00');

  const cartGst = await page.getByTestId('cart-gst').textContent();
  const cartTotal = await page.getByTestId('cart-total').textContent();
  expect(cartGst).not.toBeNull();
  expect(cartTotal).not.toBeNull();

  await page.getByTestId('cart-checkout').click();
  await expect(page.getByTestId(`checkout-line-${productId}`)).toContainText(
    `${productName} × 2`,
  );
  await expect(page.getByTestId('checkout-subtotal')).toHaveText('$29.00');
  await expect(page.getByTestId('checkout-gst')).toHaveText(cartGst!);
  await expect(page.getByTestId('checkout-total')).toHaveText(cartTotal!);

  await page.getByTestId('checkout-name').fill('Test Customer');
  await page.getByTestId('checkout-email').fill(email);
  await page.getByTestId('checkout-address').fill('1 Queen Street');
  await page.getByTestId('checkout-city').fill('Auckland');
  await page.getByTestId('checkout-postcode').fill('1010');
  await page.getByTestId('checkout-submit').click();

  await expect(page.getByTestId('order-confirmation')).toContainText(
    'Thanks Test Customer!',
  );
  await expect(page.getByTestId('order-id')).toHaveText(/^#[0-9a-f-]+$/i);
  await expect(page.getByTestId('order-total')).toHaveText('$33.35');
  await expect(page.getByTestId('nav-cart-count')).toHaveCount(0);
});
