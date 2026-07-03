/// <reference types="cypress" />

const API = Cypress.env('apiBase');

describe('Account tools', () => {
  beforeEach(() => {
    // Ensure ACC-12345 has known movements: +500 deposit, -50 withdrawal.
    cy.request('POST', `${API}/transactions`, {
      fromAccount: 'ACC-00000', toAccount: 'ACC-12345', amount: 500.0, currency: 'USD', type: 'deposit',
    });
    cy.request('POST', `${API}/transactions`, {
      fromAccount: 'ACC-12345', toAccount: 'ACC-00000', amount: 50.0, currency: 'USD', type: 'withdrawal',
    });
    cy.visit('/');
    cy.get('a[data-view="accounts"]').first().click();
    cy.get('#view-accounts').should('be.visible');
  });

  it('shows a numeric balance for an account', () => {
    cy.get('#bAccount').clear().type('ACC-12345');
    cy.get('#balanceBtn').click();
    cy.get('#balanceOut').should('be.visible').invoke('text').should('match', /\d+\.\d{2}/);
  });

  it('shows the summary stats', () => {
    cy.get('#sAccount').clear().type('ACC-12345');
    cy.get('#summaryBtn').click();
    cy.get('#summaryOut').should('be.visible').and('contain.text', 'Total deposits');
    cy.get('#summaryOut').should('contain.text', 'Transactions');
  });

  it('calculates simple interest', () => {
    cy.get('#iAccount').clear().type('ACC-12345');
    cy.get('#iRate').clear().type('0.05');
    cy.get('#iDays').clear().type('30');
    cy.get('#interestBtn').click();
    cy.get('#interestOut').should('be.visible').and('contain.text', 'Interest');
  });
});
