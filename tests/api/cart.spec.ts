import { test, expect, type APIRequestContext } from '@playwright/test';
import { API_BASE_URL } from '../config';
import { createAuthenticatedUser } from '../auth-helper';

async function addKnownProductToCart(request: APIRequestContext) {
  const { token } = await createAuthenticatedUser(request);
  const productId = 'p-001';
  const quantity = 2;

  const productResponse = await request.get(
    `${API_BASE_URL}/products/${productId}`,
  );
  expect(productResponse.status()).toBe(200);

  const product = await productResponse.json();

  const cartResponse = await request.post(`${API_BASE_URL}/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      productId,
      quantity,
    },
  });
  expect(cartResponse.status()).toBe(201);

  return {
    product,
    quantity,
    cart: await cartResponse.json(),
  };
}

test('adds a product and returns the correct cart line', async ({ request }) => {
  const { product, quantity, cart } = await addKnownProductToCart(request);

  const expectedLineTotal = Number((product.price * quantity).toFixed(2));

  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].productId).toBe(product.id);
  expect(cart.items[0].quantity).toBe(quantity);
  expect(cart.items[0].unitPrice).toBe(product.price);
  expect(cart.items[0].lineTotal).toBe(expectedLineTotal);
  expect(cart.subtotal).toBe(expectedLineTotal);
});

test('calculates GST using the documented 15% rate', async ({ request }) => {
  const { cart } = await addKnownProductToCart(request);

  const expectedGst = Number((cart.subtotal * 0.15).toFixed(2));
  const expectedTotal = Number(
    (cart.subtotal + expectedGst).toFixed(2),
  );

  test.fail(true, 'BIDSHOP-001: cart currently applies 12.5% GST');

  expect(cart.gst).toBe(expectedGst);
  expect(cart.total).toBe(expectedTotal);
});
