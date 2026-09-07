import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

test('successful order is accurately recorded', async ({ request }) => {
  const { token, email, user } = await createAuthenticatedUser(request);
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const productId = 'p-018';
  const quantity = 2;
  const customer = {
    name: 'Test User',
    email,
    address: '1 Queen Street',
    city: 'Auckland',
    postcode: '1010',
  };

  const productBeforeResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productBeforeResponse.status()).toBe(200);

  const productBefore = await productBeforeResponse.json();
  expect(productBefore.stock).toBeGreaterThanOrEqual(quantity);

  const cartResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers,
    data: {
      productId,
      quantity,
    },
  });
  expect(cartResponse.status()).toBe(201);

  const createOrderResponse = await request.post(`${API_BASE_URL}/orders`, {
    headers,
    data: {
      customer,
    },
  });
  expect(createOrderResponse.status()).toBe(201);

  const order = await createOrderResponse.json();
  const expectedLineTotal = Number((productBefore.price * quantity).toFixed(2));
  const expectedSubtotal = expectedLineTotal;
  const expectedGst = Number((expectedSubtotal * 0.15).toFixed(2));
  const expectedTotal = Number((expectedSubtotal + expectedGst).toFixed(2));

  expect(order.status).toBe('CONFIRMED');
  expect(order.userId).toBe(user.id);
  expect(order.items).toEqual([
    {
      productId: productBefore.id,
      name: productBefore.name,
      unitPrice: productBefore.price,
      quantity,
      lineTotal: expectedLineTotal,
    },
  ]);
  expect(order.subtotal).toBe(expectedSubtotal);
  expect(order.gst).toBe(expectedGst);
  expect(order.total).toBe(expectedTotal);
  expect(order.customer).toEqual(customer);
  expect(order.id).toEqual(expect.any(String));
  expect(Date.parse(order.createdAt)).not.toBeNaN();

  const getOrderResponse = await request.get(
    `${API_BASE_URL}/orders/${order.id}`,
    { headers },
  );
  expect(getOrderResponse.status()).toBe(200);
  expect(await getOrderResponse.json()).toEqual(order);

  const listOrdersResponse = await request.get(`${API_BASE_URL}/orders`, {
    headers,
  });
  expect(listOrdersResponse.status()).toBe(200);

  const orders = await listOrdersResponse.json();
  expect(orders.count).toBe(1);
  expect(orders.items).toContainEqual(order);

  const cartAfterResponse = await request.get(`${API_BASE_URL}/cart`, {
    headers,
  });
  expect(cartAfterResponse.status()).toBe(200);

  const cartAfter = await cartAfterResponse.json();
  expect(cartAfter.items).toEqual([]);
  expect(cartAfter.subtotal).toBe(0);
  expect(cartAfter.gst).toBe(0);
  expect(cartAfter.total).toBe(0);

  const productAfterResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productAfterResponse.status()).toBe(200);

  const productAfter = await productAfterResponse.json();
  expect(productAfter.stock).toBe(productBefore.stock - quantity);
});

test("rejected order does not lose the customer's cart or mutate stock", async ({
  request,
}) => {
  const { token, email } = await createAuthenticatedUser(request);
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const productId = 'p-017';
  const quantity = 2;

  const productBeforeResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productBeforeResponse.status()).toBe(200);

  const productBefore = await productBeforeResponse.json();
  expect(productBefore.stock).toBeGreaterThanOrEqual(quantity);

  const cartResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers,
    data: {
      productId,
      quantity,
    },
  });
  expect(cartResponse.status()).toBe(201);

  const ordersBeforeResponse = await request.get(`${API_BASE_URL}/orders`, {
    headers,
  });
  expect(ordersBeforeResponse.status()).toBe(200);

  const ordersBefore = await ordersBeforeResponse.json();

  const rejectedOrderResponse = await request.post(`${API_BASE_URL}/orders`, {
    headers,
    data: {
      customer: {
        name: 'Test User',
        email,
        address: '1 Queen Street',
        city: 'Auckland',
        postcode: 'invalid',
      },
    },
  });
  expect(rejectedOrderResponse.status()).toBe(400);
  expect(await rejectedOrderResponse.json()).toEqual({
    error: 'postcode must be a 4-digit NZ postcode',
  });

  const cartAfterResponse = await request.get(`${API_BASE_URL}/cart`, {
    headers,
  });
  expect(cartAfterResponse.status()).toBe(200);

  const cartAfter = await cartAfterResponse.json();
  expect(cartAfter.items).toHaveLength(1);
  expect(cartAfter.items[0]).toEqual(
    expect.objectContaining({
      productId,
      quantity,
    }),
  );

  const productAfterResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productAfterResponse.status()).toBe(200);

  const productAfter = await productAfterResponse.json();
  expect(productAfter.stock).toBe(productBefore.stock);

  const ordersAfterResponse = await request.get(`${API_BASE_URL}/orders`, {
    headers,
  });
  expect(ordersAfterResponse.status()).toBe(200);

  const ordersAfter = await ordersAfterResponse.json();
  expect(ordersAfter.count).toBe(ordersBefore.count);
  expect(ordersAfter.items).toEqual(ordersBefore.items);
});
