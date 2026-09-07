import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

test('rejected over-stock cart changes do not mutate cart or inventory', async ({
  request,
}) => {
  const { token } = await createAuthenticatedUser(request);
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const productId = 'p-015';

  const productBeforeResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productBeforeResponse.status()).toBe(200);

  const productBefore = await productBeforeResponse.json();
  const overStockQuantity = productBefore.stock + 1;

  const rejectedAddResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers,
    data: {
      productId,
      quantity: overStockQuantity,
    },
  });
  expect(rejectedAddResponse.status()).toBe(400);
  expect(await rejectedAddResponse.json()).toEqual({
    error: `Only ${productBefore.stock} unit(s) available`,
  });

  const cartAfterRejectedAddResponse = await request.get(
    `${API_BASE_URL}/cart`,
    { headers },
  );
  expect(cartAfterRejectedAddResponse.status()).toBe(200);

  const cartAfterRejectedAdd = await cartAfterRejectedAddResponse.json();
  expect(cartAfterRejectedAdd.items).toEqual([]);

  const productAfterRejectedAddResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productAfterRejectedAddResponse.status()).toBe(200);

  const productAfterRejectedAdd = await productAfterRejectedAddResponse.json();
  expect(productAfterRejectedAdd.stock).toBe(productBefore.stock);

  const validAddResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers,
    data: {
      productId,
      quantity: 1,
    },
  });
  expect(validAddResponse.status()).toBe(201);

  const rejectedUpdateResponse = await request.patch(
    `${API_BASE_URL}/cart/items/${productId}`,
    {
      headers,
      data: {
        quantity: overStockQuantity,
      },
    },
  );
  expect(rejectedUpdateResponse.status()).toBe(400);
  expect(await rejectedUpdateResponse.json()).toEqual({
    error: `Only ${productBefore.stock} unit(s) available`,
  });

  const cartAfterRejectedUpdateResponse = await request.get(
    `${API_BASE_URL}/cart`,
    { headers },
  );
  expect(cartAfterRejectedUpdateResponse.status()).toBe(200);

  const cartAfterRejectedUpdate = await cartAfterRejectedUpdateResponse.json();
  expect(cartAfterRejectedUpdate.items).toHaveLength(1);
  expect(cartAfterRejectedUpdate.items[0]).toEqual(
    expect.objectContaining({
      productId,
      quantity: 1,
    }),
  );

  const productAfterRejectedUpdateResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productAfterRejectedUpdateResponse.status()).toBe(200);

  const productAfterRejectedUpdate =
    await productAfterRejectedUpdateResponse.json();
  expect(productAfterRejectedUpdate.stock).toBe(productBefore.stock);
});
