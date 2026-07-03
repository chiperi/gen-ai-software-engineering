# 🧪 Cypress end-to-end tests

Browser-driven E2E tests that exercise the banking web UI against a **live backend**.
They drive the static **Electron renderer** (`../frontend-electron/renderer`, stable element
ids) served on `:8080`, talking to any backend on `:3000`.

## Specs

| File | Covers |
|------|--------|
| `cypress/e2e/transactions.cy.js` | seeded list renders, status badges, API-online chip, filter by type/account, clear, CSV button |
| `cypress/e2e/create-transaction.cy.js` | inline validation errors from the backend `400`, happy-path create → success toast → back to list |
| `cypress/e2e/account-tools.cy.js` | balance, summary, and simple-interest flows |

## How to run

You need a backend running on `:3000` (any of the four — e.g. FastAPI or Go). Then:

```bash
# 1) start a backend on :3000 (in another terminal), e.g.
cd ../backend-go && go run ./cmd/server

# 2) install + run the E2E suite (serves the UI on :8080, runs Cypress headless)
cd e2e
npm install
npm run e2e            # = serve UI on :8080 + cypress run
# or, with the UI already served:
npm run cypress:open   # interactive
```

`npm run e2e` uses `start-server-and-test` to boot the static UI (`http-server` on
`:8080`), wait for it, then run Cypress headless. The specs seed their own data via
`cy.request()` against `:3000`, so a fresh in-memory backend is fine.

Configuration lives in `cypress.config.js` (`baseUrl`, `chromeWebSecurity:false` for the
cross-origin `:3000` calls, and `apiBase` env).

> **Sandbox note:** the CI/dev sandbox these tests were authored in blocks
> `download.cypress.io`, so the Cypress binary can't be fetched there and the suite is
> run **locally**. `npm install` downloads the Cypress binary on a normal network.
