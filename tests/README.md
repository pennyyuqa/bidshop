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

Prerequisites: Node.js 20 or newer, npm, and Git.

### 1. Clone the repository and enter its root directory

```bash
git clone https://github.com/pennyyuqa/bidshop.git
cd bidshop
```

All commands below must be run from this root directory—the directory containing
`package.json`, `playwright.config.ts`, `backend/`, `frontend/`, and `tests/`.

### 2. Check the Node.js version

Node.js 20 is the minimum supported version and is used in CI. Newer Node.js
versions can also be used locally. This repository includes an `.nvmrc` file
for selecting Node.js 20 with `nvm`:

```bash
nvm install
nvm use
node --version
```

The reported version should be `v20` or newer. If you do not use `nvm`, run
`node --version` directly and install Node.js 20 or newer only if required.

### 3. Install dependencies

```bash
npm ci                     # Playwright test dependencies
npm ci --prefix backend    # Express API dependencies
npm ci --prefix frontend   # React application dependencies
```

The three commands are required because the test project, backend, and frontend
each have their own `package.json` and lockfile.

### 4. Install Chromium for Playwright

```bash
npx playwright install chromium
```

On Linux, use `npx playwright install --with-deps chromium` if the required
system browser dependencies are not already installed.

### 5. Run the tests

Run these commands from the same repository root:

```bash
npm test              # run all API and UI tests
npm run test:api      # run API tests only
npm run test:ui       # run UI tests only
npm run test:headed   # run with a visible browser
npm run test:report   # open the latest HTML report
```

Do not start the backend or frontend manually for the automated tests.
Playwright starts both services and waits for them to become available. Ensure
ports `4000` and `5173` are free before running the suite so it starts with a
fresh in-memory application state.

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
