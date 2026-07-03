const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // The static Electron renderer (frontend-electron/renderer) served on :8080.
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    fixturesFolder: false,
    video: false,
    // The renderer calls the API on http://localhost:3000 (cross-origin); allow it.
    chromeWebSecurity: false,
    env: {
      // Backend base URL used by cy.request() for seeding/asserting.
      apiBase: 'http://localhost:3000',
    },
  },
});
