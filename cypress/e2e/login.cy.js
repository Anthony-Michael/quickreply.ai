describe('Login Page', () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit('/auth/login')
  })

  it('displays the login form with correct elements', () => {
    // Check page title and heading
    cy.contains('h1', 'Welcome Back').should('be.visible')
    cy.contains('Sign in to your account').should('be.visible')
    
    // Check form elements
    cy.get('label[for="email"]').should('contain', 'Email address')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('label[for="password"]').should('contain', 'Password')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'Sign in')
    
    // Check links
    cy.contains('a', 'Forgot your password?').should('be.visible')
    cy.contains('a', 'Sign up').should('be.visible')
  })

  it('validates the email format', () => {
    // Try submitting with invalid email
    cy.get('input[type="email"]').type('invalid-email')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    // The browser's native validation should prevent form submission
    // We can check if we're still on the login page
    cy.url().should('include', '/auth/login')
  })

  it('navigates to the signup page', () => {
    cy.contains('a', 'Sign up').click()
    cy.url().should('include', '/auth/signup')
    // Optionally verify that signup page elements are visible
  })

  it('navigates to the forgot password page', () => {
    cy.contains('a', 'Forgot your password?').click()
    cy.url().should('include', '/auth/forgot-password')
    // Optionally verify that forgot password page elements are visible
  })

  // Add authentication tests once backend is connected
  // This is just a placeholder to show how it would work
  /*
  it('logs in with valid credentials', () => {
    cy.get('input[type="email"]').type('user@example.com')
    cy.get('input[type="password"]').type('correct-password')
    cy.get('button[type="submit"]').click()
    
    // Assuming successful login redirects to dashboard
    cy.url().should('include', '/dashboard')
  })

  it('shows error with invalid credentials', () => {
    cy.get('input[type="email"]').type('user@example.com')
    cy.get('input[type="password"]').type('wrong-password')
    cy.get('button[type="submit"]').click()
    
    // Assuming error message is shown
    cy.contains('Invalid email or password').should('be.visible')
  })
  */
}) 