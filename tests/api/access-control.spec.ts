import { test, expect } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

test("a customer cannot access another customer's cart or order", async ({
  request,
}) => {
  const customerA = await createAuthenticatedUser(request);
  const customerB = await createAuthenticatedUser(request);
  const customerAHeaders = {
    Authorization: `Bearer ${customerA.token}`,
  };
  const customerBHeaders = {
    Authorization: `Bearer ${customerB.token}`,
  };

  const addToCustomerACartResponse = await request.post(
    `${API_BASE_URL}/cart/items`,
    {
      headers: customerAHeaders,
      data: {
        productId: 'p-016',
        quantity: 1,
      },
    },
  );
  expect(addToCustomerACartResponse.status()).toBe(201);

  const customerBCartResponse = await request.get(`${API_BASE_URL}/cart`, {
    headers: customerBHeaders,
  });
  expect(customerBCartResponse.status()).toBe(200);

  const customerBCart = await customerBCartResponse.json();
  expect(customerBCart.userId).toBe(customerB.user.id);
  expect(customerBCart.items).toEqual([]);

  const createCustomerAOrderResponse = await request.post(
    `${API_BASE_URL}/orders`,
    {
      headers: customerAHeaders,
      data: {
        customer: {
          name: 'Customer A',
          email: customerA.email,
          address: '1 Queen Street',
          city: 'Auckland',
          postcode: '1010',
        },
      },
    },
  );
  expect(createCustomerAOrderResponse.status()).toBe(201);

  const customerAOrder = await createCustomerAOrderResponse.json();

  const customerBOrdersResponse = await request.get(`${API_BASE_URL}/orders`, {
    headers: customerBHeaders,
  });
  expect(customerBOrdersResponse.status()).toBe(200);
  expect(await customerBOrdersResponse.json()).toEqual({
    count: 0,
    items: [],
  });

  const customerBGetCustomerAOrderResponse = await request.get(
    `${API_BASE_URL}/orders/${customerAOrder.id}`,
    { headers: customerBHeaders },
  );
  expect(customerBGetCustomerAOrderResponse.status()).toBe(404);
  expect(await customerBGetCustomerAOrderResponse.json()).toEqual({
    error: 'Order not found',
  });

  const anonymousCartResponse = await request.get(`${API_BASE_URL}/cart`);
  expect(anonymousCartResponse.status()).toBe(401);

  const anonymousOrdersResponse = await request.get(`${API_BASE_URL}/orders`);
  expect(anonymousOrdersResponse.status()).toBe(401);
});
