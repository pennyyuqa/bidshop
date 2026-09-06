import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:4000';

test('should return the seeded product catalogue', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/products`);

  expect(response.status()).toBe(200);

  const body = await response.json();

  expect(body.count).toBe(18);
  expect(body.items).toHaveLength(18);
});