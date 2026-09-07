import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

test('should add a product to cart', async ({ request }) => {
  const { token } = await createAuthenticatedUser(request);

  const productsResponse = await request.get(`${API_BASE_URL}/products`);
  const productsBody = await productsResponse.json();

  const product = productsBody.items[0];

  const response = await request.post(`${API_BASE_URL}/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      productId: product.id,
      quantity: 2,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items[0].productId).toBe(product.id);
  expect(body.items[0].quantity).toBe(2);

  expect(body.items[0].lineTotal).toBe(
    body.items[0].unitPrice * body.items[0].quantity,
  );

  const expectedGst = Number((body.subtotal * 0.15).toFixed(2));
  const expectedTotal = Number(
    (body.subtotal + expectedGst).toFixed(2),
  );

  test.fail(true, 'BIDSHOP-001: cart currently applies 12.5% GST');

  expect(body.gst).toBe(expectedGst);
  expect(body.total).toBe(expectedTotal);
});
