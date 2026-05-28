/* eslint-disable no-undef */

describe('Smoke', () => {
  it('renderiza a tela de login', () => {
    cy.visit('/login');
    cy.findByRole('heading', { name: /entrar|login/i }).should('be.visible');
  });
});
