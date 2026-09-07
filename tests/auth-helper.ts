import { APIRequestContext, expect } from '@playwright/test';
import { API_BASE_URL } from './config';

export async function createAuthenticatedUser(request: APIRequestContext) {
  const email = `user_${Date.now()}_${Math.random()}@example.com`;
  const password = 'secret1';
  const name = 'Test User';

  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      email,
      password,
      name,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  return {
    token: body.token,
    user: body.user,
    email,
    password,
  };
}