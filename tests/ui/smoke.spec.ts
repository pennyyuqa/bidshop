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

test('displays images for products with known broken image URLs', async ({
  page,
}) => {
  await page.goto('/');

  const products = [
    { id: 'p-003', name: 'Bluff Oysters (Dozen)' },
    { id: 'p-010', name: 'Puhoi Valley Greek Yoghurt' },
    { id: 'p-012', name: 'Sourdough Ciabatta' },
  ];
  const imageResults = [];

  for (const product of products) {
    const productImage = page
      .getByTestId(`product-card-${product.id}`)
      .getByRole('img', { name: product.name });

    await productImage.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        productImage.evaluate((image: HTMLImageElement) => image.complete),
      )
      .toBe(true);

    imageResults.push({
      id: product.id,
      name: product.name,
      naturalWidth: await productImage.evaluate(
        (image: HTMLImageElement) => image.naturalWidth,
      ),
    });
  }

  test.fail(
    true,
    'BIDSHOP-002: known product images currently fail to load',
  );

  expect(imageResults.filter((image) => image.naturalWidth === 0)).toEqual([]);
});
