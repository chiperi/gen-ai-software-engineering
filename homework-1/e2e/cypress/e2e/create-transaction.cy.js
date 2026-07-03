/// <reference types="cypress" />

describe('Create transaction', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('a[data-view="new"]').first().click();
    cy.get('#view-new').should('be.visible');
  });

  it('shows per-field validation errors from the backend 400 response', () => {
    cy.get('#nFrom').clear().type('BADACC'); // not ACC-XXXXX
    cy.get('#nTo').clear().type('ACC-67890');
    cy.get('#nAmount').clear().type('-10'); // must be positive
    cy.get('#createBtn').click();

    cy.get('#eFrom').should('not.have.text', '');
    cy.get('#eAmount').should('not.have.text', '');
  });

  it('creates a valid transaction, toasts success and returns to the list', () => {
    cy.get('#nFrom').clear().type('ACC-12345');
    cy.get('#nTo').clear().type('ACC-67890');
    cy.get('#nAmount').clear().type('123.45');
    cy.get('#nCurrency').select('USD');
    cy.get('#nType').select('transfer');
    cy.get('#createBtn').click();

    cy.get('.toast.success', { timeout: 8000 }).should('contain.text', 'created');
    cy.get('#view-transactions').should('be.visible');
    cy.get('#txTable').should('contain.text', 'ACC-12345');
  });
});
