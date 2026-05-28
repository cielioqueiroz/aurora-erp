/* eslint-disable no-undef */

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.findByLabelText(/e-?mail/i).type(email);
  cy.findByLabelText(/senha/i).type(password);
  cy.findByRole('button', { name: /entrar/i }).click();
});
