import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

test('should place an order from the current cart', async ({ request }) => {
  const { token, email } = await createAuthenticatedUser(request);

  const productsResponse = await request.get(`${API_BASE_URL}/products`);
  expect(productsResponse.status()).toBe(200);

  const productsBody = await productsResponse.json();
  const product = productsBody.items[0];

  const cartResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      productId: product.id,
      quantity: 1,
    },
  });

  expect(cartResponse.status()).toBe(201);

  const response = await request.post(`${API_BASE_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      customer: {
        name: 'Test User',
        email,
        address: '1 Queen Street',
        city: 'Auckland',
        postcode: '1010',
      },
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.id).toBeTruthy();
  expect(body.customer.email).toBe(email);
  expect(body.items.length).toBeGreaterThan(0);
});