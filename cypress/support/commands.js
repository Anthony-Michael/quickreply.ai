// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// -- Authentication Commands --

/**
 * Custom command to mock authentication
 * @param {Object} options - Authentication options
 * @param {string} options.tier - Subscription tier ('free', 'business', 'premium', 'trial')
 * @param {number} options.responsesUsed - Number of responses used
 * @param {number} options.responsesLimit - Total response limit
 * @param {boolean} options.expired - Whether the token is expired
 */
Cypress.Commands.add('mockAuth', (options = {}) => {
  const defaults = {
    tier: 'free',
    responsesUsed: 5,
    responsesLimit: 25,
    expired: false
  };

  const config = { ...defaults, ...options };
  
  // Calculate token expiration
  const expiresAt = config.expired 
    ? new Date(Date.now() - 3600000).getTime() // 1 hour ago
    : new Date(Date.now() + 3600000).getTime(); // 1 hour from now

  // Mock authentication session
  cy.intercept('POST', '/api/auth/session', {
    statusCode: config.expired ? 401 : 200,
    body: config.expired 
      ? { error: 'Token expired' }
      : {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            subscription_tier: config.tier,
            monthly_responses_limit: config.responsesLimit,
            monthly_responses_used: config.responsesUsed
          },
          session: {
            access_token: config.expired ? 'expired-token' : 'valid-token',
            expires_at: expiresAt
          }
        }
  }).as('authSession');
});

/**
 * Custom command to mock OpenAI API response
 * @param {Object} options - API response options
 * @param {number} options.status - HTTP status code
 * @param {string} options.response - Generated response text
 * @param {string} options.businessName - Business name
 * @param {string} options.error - Error message
 * @param {string} options.errorCode - Error code
 * @param {number} options.delay - Response delay in ms
 */
Cypress.Commands.add('mockOpenAI', (options = {}) => {
  const defaults = {
    status: 200,
    response: 'This is a test AI-generated response.',
    businessName: 'Test Company',
    error: null,
    errorCode: null,
    delay: 0
  };

  const config = { ...defaults, ...options };
  
  // Prepare response body based on status
  let responseBody = {};
  
  if (config.status >= 200 && config.status < 300) {
    responseBody = {
      response: config.response,
      businessName: config.businessName
    };
  } else {
    responseBody = {
      error: config.error || 'An error occurred',
      errorCode: config.errorCode
    };
    
    // Add subscription limit details if applicable
    if (config.errorCode === 'SUBSCRIPTION_LIMIT_REACHED') {
      responseBody.currentUsage = options.currentUsage || 25;
      responseBody.limit = options.limit || 25;
      responseBody.tier = options.tier || 'free';
    }
  }

  // Mock OpenAI API response
  cy.intercept('POST', '/api/openai', {
    statusCode: config.status,
    body: responseBody,
    delay: config.delay
  }).as('openaiResponse');
});

/**
 * Custom command to fill and submit the email composer form
 * @param {Object} options - Form options
 * @param {string} options.email - Customer email content
 * @param {string} options.context - Business context
 * @param {string} options.tone - Response tone
 */
Cypress.Commands.add('generateResponse', (options = {}) => {
  const defaults = {
    email: 'Hello, this is a test email.',
    context: '',
    tone: 'professional'
  };

  const config = { ...defaults, ...options };
  
  // Enter customer email
  cy.get('textarea[id="customerEmail"]').clear().type(config.email);
  
  // Open advanced options if context or non-default tone
  if (config.context || config.tone !== 'professional') {
    cy.contains('Advanced Options').click();
    
    // Enter business context if provided
    if (config.context) {
      cy.get('textarea[id="businessContext"]').clear().type(config.context);
    }
    
    // Select tone if not default
    if (config.tone !== 'professional') {
      cy.get('select[id="tone"]').select(config.tone);
    }
  }
  
  // Click generate button
  cy.get('button').contains('Generate Email Response').click();
});