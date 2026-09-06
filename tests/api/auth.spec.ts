import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';

test.describe('Auth API', () => {
  test('should register a new user', async ({ request }) => {
    const email = `user_${Date.now()}@example.com`;

    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email,
        password: 'secret1',
        name: 'Test User',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(email);
    expect(body.user.name).toBe('Test User');
  });

  test('should reject registration with an existing email', async ({ request }) => {
    const email = `user_${Date.now()}@example.com`;

    const user = {
      email,
      password: 'secret1',
      name: 'Test User',
    };

    await request.post(`${API_BASE_URL}/auth/register`, {
      data: user,
    });

    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: user,
    });

    expect(response.status()).toBe(409);
  });
});