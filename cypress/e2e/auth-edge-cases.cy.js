describe('Authentication Edge Cases', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should redirect to login when accessing protected page without authentication', () => {
    // Visit a protected page without authentication
    cy.visit('/dashboard');
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    cy.contains('Please log in to access this page').should('be.visible');
  });

  it('should handle expired tokens when accessing protected pages', () => {
    // Mock expired authentication
    cy.mockAuth({ expired: true });
    
    // Visit a protected page
    cy.visit('/dashboard');
    
    // Verify redirect to login page with expired session message
    cy.url().should('include', '/login');
    cy.contains('Your session has expired').should('be.visible');
  });

  it('should handle invalid login credentials', () => {
    // Mock failed login attempt
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Invalid email or password'
      }
    }).as('loginAttempt');
    
    // Visit login page
    cy.visit('/login');
    
    // Enter invalid credentials
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Wait for login attempt
    cy.wait('@loginAttempt');
    
    // Verify error message
    cy.contains('Invalid email or password').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should successfully login and maintain session', () => {
    // Mock successful login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('loginAttempt');
    
    // Mock successful session
    cy.mockAuth();
    
    // Visit login page
    cy.visit('/login');
    
    // Enter valid credentials
    cy.get('input[type="email"]').type('valid@example.com');
    cy.get('input[type="password"]').type('correctpassword');
    cy.get('button[type="submit"]').click();
    
    // Wait for login attempt
    cy.wait('@loginAttempt');
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Navigate to another protected page
    cy.visit('/email-composer');
    
    // Verify no redirect occurs (session maintained)
    cy.url().should('include', '/email-composer');
  });

  it('should refresh session when token is about to expire', () => {
    // Mock initial auth with token that expires soon
    const expiresAt = new Date(Date.now() + 60000).getTime(); // 1 minute from now
    
    cy.intercept('POST', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          subscription_tier: 'free'
        },
        session: {
          access_token: 'about-to-expire-token',
          expires_at: expiresAt
        }
      }
    }).as('initialSession');
    
    // Mock session refresh
    cy.intercept('POST', '/api/auth/refresh', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          subscription_tier: 'free'
        },
        session: {
          access_token: 'refreshed-token',
          expires_at: new Date(Date.now() + 3600000).getTime() // 1 hour from now
        }
      }
    }).as('sessionRefresh');
    
    // Visit protected page
    cy.visit('/dashboard');
    cy.wait('@initialSession');
    
    // Trigger an action that would check token expiration
    cy.contains('Profile').click();
    
    // Verify session refresh was called
    cy.wait('@sessionRefresh');
    
    // Verify user remains on the page
    cy.url().should('include', '/profile');
  });

  it('should handle logout correctly', () => {
    // Mock successful authentication
    cy.mockAuth();
    
    // Mock successful logout
    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('logoutAttempt');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Click logout button
    cy.contains('Logout').click();
    
    // Wait for logout attempt
    cy.wait('@logoutAttempt');
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    
    // Try to access protected page again
    cy.visit('/dashboard');
    
    // Verify redirect back to login
    cy.url().should('include', '/login');
  });

  it('should handle rate limiting on login attempts', () => {
    // Mock rate limited login attempt
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 429,
      body: {
        error: 'Too many login attempts. Please try again in 15 minutes.'
      }
    }).as('rateLimitedLogin');
    
    // Visit login page
    cy.visit('/login');
    
    // Enter credentials
    cy.get('input[type="email"]').type('valid@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    // Wait for rate limited response
    cy.wait('@rateLimitedLogin');
    
    // Verify error message
    cy.contains('Too many login attempts').should('be.visible');
    cy.contains('15 minutes').should('be.visible');
    
    // Verify login button is disabled temporarily
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should handle server errors during authentication', () => {
    // Mock server error during login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 500,
      body: {
        error: 'Internal server error'
      }
    }).as('serverErrorLogin');
    
    // Visit login page
    cy.visit('/login');
    
    // Enter credentials
    cy.get('input[type="email"]').type('valid@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    // Wait for server error response
    cy.wait('@serverErrorLogin');
    
    // Verify error message
    cy.contains('Something went wrong').should('be.visible');
    cy.contains('Please try again later').should('be.visible');
    
    // Verify user remains on login page
    cy.url().should('include', '/login');
  });
}); 