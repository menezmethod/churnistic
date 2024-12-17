describe('Authentication', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Sign In Page', () => {
    beforeEach(() => {
      cy.visit('/auth/signin');
    });

    it('should display sign in form with all elements', () => {
      cy.get('h1').should('contain', 'Sign in');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign in');
      cy.get('button').contains('Sign in with Google').should('be.visible');
      cy.get('button').contains('Sign in with GitHub').should('be.visible');
      cy.get('button').contains('Forgot your password?').should('be.visible');
      cy.get('a').contains('Sign up').should('be.visible');
    });

    it('should show validation errors for invalid email', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="email-helper-text"]').should(
        'contain',
        'Please enter a valid email address'
      );
    });

    it('should show validation errors for short password', () => {
      cy.get('input[name="password"]').type('12345');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="password-helper-text"]').should(
        'contain',
        'Password must be at least 6 characters'
      );
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('wrongpassword{enter}');
      cy.get('[data-testid="email-helper-text"]').should(
        'contain',
        'Invalid email or password'
      );
      cy.get('[data-testid="password-helper-text"]').should(
        'contain',
        'Invalid email or password'
      );
    });

    it('should navigate to sign up page', () => {
      cy.get('a').contains('Sign up').click();
      cy.url().should('include', '/auth/signup');
    });

    it('should open forgot password dialog', () => {
      cy.get('button').contains('Forgot your password?').click();
      cy.get('div[role="dialog"]').should('be.visible');
      cy.get('div[role="dialog"]').within(() => {
        cy.get('h2').should('contain', 'Reset Password');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('button').contains('Send Reset Link').should('be.visible');
      });
    });
  });

  describe('Forgot Password Dialog', () => {
    beforeEach(() => {
      cy.visit('/auth/signin');
      cy.get('button').contains('Forgot your password?').click();
    });

    it('should validate email in forgot password dialog', () => {
      cy.get('div[role="dialog"]').within(() => {
        cy.get('input[type="email"]').type('invalid-email');
        cy.get('button').contains('Send Reset Link').click();
        cy.get('[data-testid="forgot-password-helper-text"]').should(
          'contain',
          'Please enter a valid email address'
        );
      });
    });

    it('should close dialog when clicking cancel', () => {
      cy.get('div[role="dialog"]').within(() => {
        cy.get('button').contains('Cancel').click();
      });
      cy.get('div[role="dialog"]').should('not.exist');
    });
  });

  describe('Sign Up Page', () => {
    beforeEach(() => {
      cy.visit('/auth/signup');
    });

    it('should display sign up form with all elements', () => {
      cy.get('h1').should('contain', 'Sign up');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Sign up');
      cy.get('button').contains('Sign up with Google').should('be.visible');
      cy.get('button').contains('Sign up with GitHub').should('be.visible');
      cy.get('a').contains('Sign in').should('be.visible');
    });

    it('should show validation errors for invalid email', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="email-helper-text"]').should(
        'contain',
        'Please enter a valid email address'
      );
    });

    it('should show validation errors for short password', () => {
      cy.get('input[name="password"]').type('12345');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="password-helper-text"]').should(
        'contain',
        'Password must be at least 6 characters'
      );
    });

    it('should show validation errors for password mismatch', () => {
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password456');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="confirm-password-helper-text"]').should(
        'contain',
        'Passwords do not match'
      );
    });

    it('should navigate to sign in page', () => {
      cy.get('a').contains('Sign in').click();
      cy.url().should('include', '/auth/signin');
    });
  });
});
