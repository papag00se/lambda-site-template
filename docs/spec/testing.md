# Testing Stack

## Tooling
- Unit and API e2e suites use Node's built-in test runner (`node --test`).
- Browser tests use Playwright with Chromium.

## Test Layout
- `tests/unit`: helper-level unit tests.
- `tests/e2e`: backend integration tests that start `backend/local.js`.
- `frontend/e2e`: browser tests that run against the local app server.

## Commands
- `npm run test:unit`
- `npm run test:e2e`
- `npm run test:browser`
- `npm test` runs all suites in order.

## Browser Test Runtime
- Default base URL: `http://127.0.0.1:4077`
- `E2E_BASE_URL` can be set to run browser tests against an already-running environment.
