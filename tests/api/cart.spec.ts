import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';

test('should add a product to cart', async ({ request }) => {
  const email = `user_${Date.now()}@example.com`;

  const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      email,
      password: 'secret1',
      name: 'Test User',
    },
  });

  const registerBody = await registerResponse.json();
  const token = registerBody.token;

  const productsResponse = await request.get(`${API_BASE_URL}/products`);
  const productsBody = await productsResponse.json();

  const product = productsBody.items[0];

  const response = await request.post(`${API_BASE_URL}/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      productId: product.id,
      quantity: 1,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items[0].productId).toBe(product.id);
});