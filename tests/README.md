# Automated test suite

This submission adds a small, risk-focused Playwright suite for the Express API
and the React customer journey.

## Framework and structure

I chose [Playwright](https://playwright.dev/) for both API and UI testing. It
provides one TypeScript toolchain, built-in HTTP and browser fixtures, automatic
waiting, isolated browser contexts, useful failure artefacts, and simple CI
integration.

- `tests/api` covers authentication, catalogue, cart pricing, order integrity,
  inventory boundaries, and customer isolation through HTTP requests.
- `tests/ui` contains a catalogue smoke check and one critical
  login-to-purchase journey in Chromium.
- `tests/auth-helper.ts` creates independent users through the API so tests do
  not rely on pre-existing accounts.

## Design principles

- **Keep abstractions lightweight:** Helpers, fixtures, or shared hooks are
  introduced only when they remove meaningful duplication or improve
  maintainability. Test setup stays explicit when scenarios need different data.
- **Fail fast during setup:** API preparation calls assert their expected status
  immediately, so a failed prerequisite is reported directly instead of causing
  a misleading failure later.
- **Use the right layer:** UI tests use the API only for data preparation, keeping
  browser coverage focused on customer-facing behaviour.
- **Keep tests isolated:** Independent users and stable product IDs reduce shared
  state interference during parallel execution.
- **Verify complete pricing relationships:** Assertions cover unit price,
  quantity, line total, subtotal, GST, and total. Expected currency values are
  rounded to two decimal places before comparison.

## Install and run

Prerequisite: Node.js 18 or newer. From a clean checkout at the repository root,
run:

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npx playwright install chromium
```

Playwright starts the backend and frontend automatically; no separate server
startup is required.

```bash
npm test              # run all API and UI tests
npm run test:api      # run API tests only
npm run test:ui       # run UI tests only
npm run test:headed   # run with a visible browser
npm run test:report   # open the latest HTML report
```

CI also type-checks the backend, builds the frontend, installs the browser, and
runs the full suite. Failed tests are retried twice, and the HTML report is
uploaded as an artefact. Traces, screenshots, and videos provide failure
diagnostics.

## Risk-based coverage

| Risk | Why it matters | Automated layer |
|---|---|---|
| Order lost or corrupted | Protects the core business promise | API + one UI journey |
| Cart/order price mismatch | Creates financial and customer-trust risk | API |
| Stock incorrectly mutated | Can cause fulfilment failures | API |
| Cross-customer data exposure | Creates a security and privacy incident | API |
| Catalogue unavailable | Prevents customers from ordering | Smoke UI |

## Known product issues

The cart API currently applies 12.5% GST instead of the documented 15%. The test
keeps the documented expectation and records the defect as an expected failure.
Broken third-party product images are documented but excluded from the core CI
gate because their availability is a noisy, non-critical release signal. See
[`KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) for evidence and impact.

## Deliberate trade-offs

- **One browser:** Chromium proves the critical flow for this time-boxed
  exercise. Cross-browser coverage would follow production usage and risk.
- **API-heavy coverage:** Business rules and state integrity are faster and more
  deterministic at the API layer; the UI suite avoids duplicating every case.
- **Product source unchanged:** Known GST and image defects are recorded rather
  than fixed, preserving the boundary of this test-focused submission.
- **Focused validation:** Order integrity, pricing, inventory, and customer
  isolation take priority over a large matrix of input-validation cases.
- **No performance test:** No workload model, service-level objective, or target
  environment was supplied. Those inputs should be agreed before meaningful
  load testing.

## Bonus feature plan

See [`DISCOUNT.md`](../DISCOUNT.md) for the discount requirements, product
questions, implementation impact, test strategy, regression protection, and
release plan.

No backend or frontend application source files were changed as part of this
submission; changes are limited to tests, test tooling, CI configuration, and
documentation.
