/// <reference types="cypress" />

const API = Cypress.env('apiBase');

function seed() {
  const rows = [
    { fromAccount: 'ACC-00000', toAccount: 'ACC-12345', amount: 500.0, currency: 'USD', type: 'deposit' },
    { fromAccount: 'ACC-12345', toAccount: 'ACC-67890', amount: 100.5, currency: 'USD', type: 'transfer' },
    { fromAccount: 'ACC-12345', toAccount: 'ACC-00000', amount: 50.0, currency: 'USD', type: 'withdrawal' },
    { fromAccount: 'ACC-00000', toAccount: 'ACC-67890', amount: 900.0, currency: 'EUR', type: 'deposit' },
  ];
  rows.forEach((body) =>
    cy.request('POST', `${API}/transactions`, body).its('status').should('eq', 201),
  );
}

describe('Transactions list', () => {
  beforeEach(() => {
    seed();
    cy.visit('/');
    cy.get('#txTable table tbody tr', { timeout: 10000 }).should('exist');
  });

  it('shows the seeded transactions with status badges and an online API chip', () => {
    cy.get('#apiChip').should('have.text', 'API online');
    cy.get('#txTable table tbody tr').its('length').should('be.gte', 4);
    cy.get('#txTable .badge.completed').should('exist');
  });

  it('filters by type = transfer', () => {
    cy.get('#fType').select('transfer');
    cy.get('#applyBtn').click();

    cy.get('#txTable table tbody tr').each(($row) => {
      cy.wrap($row).find('td').eq(4).should('contain.text', 'transfer');
    });
  });

  it('filters by account and clears back to the full list', () => {
    cy.get('#fAccount').type('ACC-67890');
    cy.get('#applyBtn').click();
    cy.get('#txTable table tbody tr').each(($row) => {
      cy.wrap($row).should('contain.text', 'ACC-67890');
    });

    cy.get('#clearBtn').click();
    cy.get('#txTable table tbody tr').its('length').should('be.gte', 4);
  });

  it('exposes a CSV export button', () => {
    cy.get('#exportBtn').should('be.visible').and('contain.text', 'Export');
  });
});
