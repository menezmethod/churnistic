describe('Authentication', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.logout();
  });

  describe('Sign In Page', () => {
    beforeEach(() => {
      cy.visit('/auth/signin');
      // Wait for the page to be fully loaded and stable
      cy.get('input[name="email"]').should('be.visible').and('be.enabled');
      cy.get('input[name="password"]').should('be.visible').and('be.enabled');
      cy.get('button[type="submit"]').should('be.visible').and('be.enabled');
    });

    it('should display sign in form with all elements', () => {
      cy.get('h1').should('contain', 'Sign in');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign in');
      cy.get('button').contains('Sign in with Google').should('be.visible');
      cy.get('button').contains('Sign in with GitHub').should('be.visible');
      cy.get('button[type="button"]')
        .contains('Forgot your password?')
        .should('be.visible');
      cy.get('a').contains('Sign up').should('be.visible');
    });

    it('should show validation errors for invalid email', () => {
      cy.get('input[name="email"]').clear().type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="email-helper-text"]').should(
        'contain',
        'Please enter a valid email address.'
      );
    });

    it('should show validation errors for short password', () => {
      cy.get('input[name="password"]').clear().type('12345');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="password-helper-text"]').should(
        'contain',
        'Password must be at least 6 characters long.'
      );
    });

    it('should show error for invalid login', () => {
      // Clear any previous state
      cy.get('input[name="email"]').clear().type('invalid@example.com');
      cy.get('input[name="password"]').clear().type('wrongpassword123');

      // Click submit and wait for loading state
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').should('be.disabled');

      // Wait for loading state to finish and error messages to appear
      cy.get('button[type="submit"]', { timeout: 10000 }).should('not.be.disabled');
      cy.get('[data-testid="email-helper-text"]', { timeout: 10000 }).should(
        'contain',
        'Invalid email or password.'
      );
      cy.get('[data-testid="password-helper-text"]', { timeout: 10000 }).should(
        'contain',
        'Invalid email or password.'
      );
    });

    it('should handle forgot password flow', () => {
      cy.get('button[type="button"]').contains('Forgot your password?').click();
      cy.get('.MuiDialog-root')
        .should('be.visible')
        .within(() => {
          cy.get('input[type="email"]').type(Cypress.env('TEST_USER_EMAIL'));
          cy.get('button[type="submit"]').contains('Send reset link').click();
          // Wait for success message
          cy.get('.MuiAlert-standardSuccess', { timeout: 10000 })
            .should('be.visible')
            .and('contain', 'Password reset email sent!');
        });
    });
  });

  describe('Authentication Flow', () => {
    beforeEach(() => {
      // Reset all state before each test
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.logout();
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });
    });

    it('should allow user to login with test credentials', () => {
      // Visit the sign-in page and wait for it to load
      cy.visit('/auth/signin', { timeout: 10000 });

      // Wait for the page to be fully loaded and stable
      cy.get('input[name="email"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');
      cy.get('input[name="password"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');
      cy.get('button[type="submit"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');

      // Perform login
      cy.get('input[name="email"]').clear().type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[name="password"]').clear().type(Cypress.env('TEST_USER_PASSWORD'));
      cy.get('button[type="submit"]').click();

      // Wait for loading state to finish and navigation to occur
      cy.get('button[type="submit"]').should('be.disabled');
      cy.url({ timeout: 10000 }).should('include', '/dashboard');

      // Logout after test
      cy.logout();
    });

    it('should allow admin to login', () => {
      // Visit the sign-in page and wait for it to load
      cy.visit('/auth/signin', { timeout: 10000 });

      // Wait for the page to be fully loaded and stable
      cy.get('input[name="email"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');
      cy.get('input[name="password"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');
      cy.get('button[type="submit"]', { timeout: 10000 })
        .should('be.visible')
        .and('be.enabled');

      // Perform login
      cy.get('input[name="email"]').clear().type(Cypress.env('TEST_ADMIN_EMAIL'));
      cy.get('input[name="password"]').clear().type(Cypress.env('TEST_ADMIN_PASSWORD'));
      cy.get('button[type="submit"]').click();

      // Wait for loading state to finish and navigation to occur
      cy.get('button[type="submit"]').should('be.disabled');
      cy.url({ timeout: 10000 }).should('include', '/dashboard');

      // Logout after test
      cy.logout();
    });
  });
});
