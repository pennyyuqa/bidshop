# Known product issues

## BIDSHOP-001: Cart applies an inconsistent GST rate

**Status:** Open  
**Severity:** High  
**Area:** Cart and order pricing

### Summary

The cart API calculates GST at 12.5%, while the product documentation and the
order API specify and calculate GST at 15%. As a result, the amount presented
in the cart differs from the amount charged when the order is created.

### Preconditions

- The backend is running with its default seed data.
- A customer is registered and has a valid bearer token.

### Steps to reproduce

1. Add two units of product `p-001` to an authenticated customer's cart.
2. Inspect the response from `POST /cart/items`.
3. Create an order from the same cart with `POST /orders`.
4. Compare the cart and order `gst` and `total` fields.

### Actual result

For a subtotal of NZD 29.00, the cart returns GST of NZD 3.63, which is 12.5%.
The cart implementation uses `subtotal * 0.125`. Order creation uses
`subtotal * 0.15`.

### Expected result

The cart and order APIs should consistently apply the documented 15% GST rate.
For a subtotal of NZD 29.00, GST should be NZD 4.35 and the total should be
NZD 33.35.

### Customer impact

Customers see a lower total in the cart than the amount calculated at
checkout. This is a pricing and trust issue and may also have tax-compliance
implications.

### Automated evidence

`tests/api/cart.spec.ts` checks the documented 15% rate and currently fails on
the cart response. The product source has deliberately not been changed as
part of this candidate submission.
