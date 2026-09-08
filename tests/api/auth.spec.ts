import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

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

  test('should reject registration with an existing email', async ({
    request,
  }) => {
    const { email, password, user } = await createAuthenticatedUser(request);

    const response = await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        email,
        password,
        name: user.name,
      },
    });

    expect(response.status()).toBe(409);
  });

  test('should login with valid credentials', async ({ request }) => {
    const { email, password } = await createAuthenticatedUser(request);

    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email,
        password,
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.token).toBeTruthy();
  });

  test('should reject login with invalid password', async ({ request }) => {
    const { email } = await createAuthenticatedUser(request);

    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email,
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBe(401);
  });
});
