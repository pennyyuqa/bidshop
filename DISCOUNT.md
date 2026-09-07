# Discount feature test plan

## Scope

Product has proposed the following feature:

> Give customers a 10% discount on any order with a subtotal over NZD $100.

This is a test and delivery plan, not an implementation. No product source code
is changed as part of this submission. Before writing automated tests, the team
needs to agree on the expected behaviour below.

## Questions for Product, Engineering, and Finance

1. Does "over $100" mean strictly greater than `$100.00`, or does `$100.00`
   qualify?
2. Is the discount applied before or after GST?
3. Is GST calculated from the original subtotal or the discounted amount?
4. Are catalogue prices GST-inclusive or GST-exclusive?
5. What rounding rule applies to discount, GST, and total?
6. Are all products and customers eligible?
7. Can this discount combine with contract prices, coupons, or future
   promotions? If so, in what order?
8. Must Cart, Checkout, order confirmation, and retrieved orders all show the
   same discount breakdown?
9. Should an order retain the discount values and rule used at checkout so a
   future rule change cannot alter historical orders?
10. If price or stock changes during checkout, should the order be recalculated
    or rejected for customer confirmation?
11. How should refunds and order amendments treat the original discount?

## Expected product impact to confirm

The delivery team will likely need to update these areas. The exact design is a
development decision after the questions above are answered.

- **API:** Cart and Order responses need enough information to expose the
  agreed discount and totals consistently.
- **UI:** Cart, Checkout, and confirmation need to display the same
  server-provided amounts.
- **Data model:** Historical orders need to retain the pricing values applied at
  checkout, including any discount information required for audit or refund.
- **Contracts:** Backend and frontend types, OpenAPI, examples, and README
  documentation must stay aligned with the final response shape.

The backend should remain the authoritative source of pricing. UI automation
should verify the displayed values, not recreate the production pricing logic
inside the test.

## Pricing behaviour to confirm

A likely calculation sequence is:

```text
subtotal
  -> discount
  -> taxable amount
  -> GST
  -> total
```

This sequence is only a proposal for discussion. Product and Finance must
confirm it before expected values are encoded in tests.

Money calculations also need an explicit rounding rule. Automated tests should
use the confirmed business rule and exact expected currency values rather than
rely on JavaScript binary floating-point behaviour.

## Automation strategy

### Pricing-level tests

The fastest tests should cover the calculation rules directly with controlled
inputs. At minimum:

| Subtotal | Expected result |
|---:|---|
| `$99.99` | No discount |
| `$100.00` | Depends on the confirmed boundary rule |
| `$100.01` | Discount applies if the rule is strictly over `$100.00` |

Also cover:

- Multiple products whose combined subtotal crosses the threshold.
- Quantity changes that move a cart into and out of eligibility.
- Amounts that exercise the confirmed discount and GST rounding rule.
- Any approved interaction with other prices or discounts.

These tests should use controlled pricing inputs rather than depend on the seed
catalogue containing products that happen to total exactly `$99.99`, `$100.00`,
or `$100.01`.

### API tests

API automation should verify:

1. A cart below the threshold has no discount and retains existing pricing.
2. An eligible cart returns the agreed discount and total.
3. Updating quantity recalculates eligibility in both directions.
4. Order creation records the same agreed pricing shown at checkout.
5. `GET /orders/:id` and `GET /orders` return the same historical amounts.
6. Inventory is reduced only by the ordered quantity.
7. A rejected order does not clear the cart, reduce inventory, or create an
   order.
8. One customer cannot access another customer's pricing or orders.

### UI test

Keep UI automation focused on one high-value journey:

1. Register a unique customer through the API.
2. Log in through the UI.
3. Add known products that cross the confirmed threshold.
4. Verify Cart displays the expected subtotal, discount, GST, and total.
5. Verify Checkout displays the same amounts.
6. Place the order.
7. Verify confirmation displays an order ID and the expected final total.
8. Verify the cart count returns to zero.

The `$99.99`, `$100.00`, `$100.01`, combination, and rounding cases belong in
faster pricing/API tests rather than being repeated as UI journeys.

## Regression protection

The existing suite should continue to prove that:

- Orders that are not eligible for a discount keep their previous amounts.
- GST remains correct under the confirmed rule.
- Cart, Checkout, Order API, and confirmation display consistent values.
- Successful orders reduce stock accurately and clear the cart once.
- Rejected orders do not mutate cart, stock, or order state.
- Over-stock cart changes remain rejected without partial mutation.
- Authentication and customer data isolation are preserved.

## Before shipping

1. Record the approved boundary, GST, eligibility, stacking, and rounding rules.
2. Update OpenAPI, types, examples, and customer-facing copy with the feature.
3. Run the new pricing, API, and UI tests plus the existing regression suite.
4. Have Product and Finance validate representative totals in UAT.
5. Confirm production monitoring can detect order failures and pricing
   mismatches.

## Definition of done

- The ambiguous requirements have written answers.
- Automated boundary and rounding tests use approved expected values.
- API and UI display consistent server-calculated pricing.
- Historical orders retain the required pricing information.
- Existing order integrity, inventory, and customer-isolation tests still pass.
- OpenAPI, types, documentation, and UAT evidence are complete.
