# Discount feature test plan

## Scope

Proposed feature:

> Give customers a 10% discount on any order with a subtotal over NZD $100.

Before implementing or automating this feature, I would first confirm the
pricing rules below. The goal is to avoid encoding assumptions into the tests.

## Questions to clarify

1. Does "over $100" mean strictly greater than `$100.00`, or should `$100.00`
   also qualify?
2. Is the discount applied before or after GST, and is GST calculated on the
   original or discounted subtotal?
3. What rounding rule should be used for discount, GST, and total?
4. Are all products and customers eligible for the discount?
5. Can this discount be combined with other pricing rules or promotions?
6. Should Cart, Checkout, order confirmation, and Order APIs all expose the
   same discount and pricing breakdown?
7. Should historical orders retain the discount and final pricing that were
   applied when the order was placed?
8. If price or stock changes during checkout, should the order be recalculated
   or rejected for customer confirmation?
9. Are there performance expectations for cart recalculation and checkout
   after the discount logic is introduced, especially for larger carts or peak
   traffic?

## Areas affected

I would expect the change to affect:

- **API:** Cart and Order responses may need to include the discount and updated
  totals.
- **UI:** Cart, Checkout, and order confirmation should display consistent
  pricing.
- **Order data:** The final pricing used at checkout should be retained with the
  order.
- **API contract:** OpenAPI and frontend/backend types should remain aligned if
  the response structure changes.

The backend should remain the source of truth for pricing. UI tests should
verify the values returned to the customer rather than duplicate the production
pricing calculation in browser tests.

## Test approach

### Pricing and API tests

I would cover the pricing rules mainly at the API or calculation level because
these tests are faster and easier to maintain. The first cases would cover the
discount boundary:

| Subtotal | Expected result |
|---:|---|
| `$99.99` | No discount |
| `$100.00` | Based on the confirmed boundary rule |
| `$100.01` | 10% discount if the rule is strictly over `$100.00` |

I would also verify:

- Multiple products whose combined subtotal crosses `$100`.
- Quantity changes that move the cart above and below the threshold.
- Discount, GST, and total calculations, including rounding.
- Cart and Order APIs return consistent pricing.
- A successful order records the same final price shown at checkout.
- A rejected order does not clear the cart, reduce stock, or create an order.
- One customer cannot access another customer's order information.

### UI test

I would keep UI coverage focused on one critical customer journey:

1. Prepare a unique customer through the API.
2. Log in through the UI.
3. Add products that make the cart eligible for the discount.
4. Verify Cart shows the expected subtotal, discount, GST, and total.
5. Continue to Checkout and verify the amounts remain consistent.
6. Place the order.
7. Verify the confirmation and final total.
8. Verify the cart is cleared.

Boundary and rounding combinations would stay in the faster API-level tests
rather than being repeated through the UI.

## Regression and release checks

Before release I would verify that:

- Orders below the threshold still use the existing pricing behaviour.
- GST and totals remain correct.
- Cart, Checkout, and Order pricing remain consistent.
- Successful orders still reduce stock and clear the cart correctly.
- Failed orders do not partially change cart, stock, or order state.
- Authentication and customer data isolation still work as expected.
- The new pricing logic does not introduce a noticeable regression in cart or
  checkout response times.
- OpenAPI and relevant types and documentation are updated if the API contract
  changes.

I would then run the existing regression suite together with the new discount
tests and have representative pricing examples confirmed during UAT.
