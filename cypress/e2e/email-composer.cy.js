describe('Email Composer', () => {
  beforeEach(() => {
    // Mock successful authentication with default settings
    cy.mockAuth();
    
    // Visit the email composer page
    cy.visit('/email-composer');
  });

  it('should render the email composer form', () => {
    cy.get('textarea[id="customerEmail"]').should('be.visible');
    cy.contains('button', 'Generate Email Response').should('be.visible');
    cy.contains('Advanced Options').should('be.visible');
  });

  it('should validate input before generating a response', () => {
    // Try to generate without entering an email
    cy.get('textarea[id="customerEmail"]').clear();
    cy.contains('button', 'Generate Email Response').click();
    cy.contains('Please enter a customer email').should('be.visible');
  });

  it('should successfully generate an AI response', () => {
    // Mock a successful OpenAI API response
    cy.mockOpenAI({
      response: 'Dear Customer, Thank you for your email. We appreciate your business. Sincerely, Test Company',
      businessName: 'Test Company'
    });

    // Generate a response
    cy.generateResponse({
      email: 'Hello, I have a question about your product.'
    });

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed
    cy.contains('Dear Customer').should('be.visible');
    cy.contains('Test Company').should('be.visible');
    cy.get('[data-testid="response-container"]').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Mock an API error
    cy.mockOpenAI({
      status: 500,
      error: 'An unexpected error occurred',
      errorCode: 'SERVER_ERROR'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify error message is displayed
    cy.contains('An error occurred while generating your response').should('be.visible');
    cy.contains('Please try again later').should('be.visible');
  });

  it('should handle subscription limit errors', () => {
    // Mock a subscription limit error
    cy.mockOpenAI({
      status: 403,
      error: 'You have reached your monthly response limit',
      errorCode: 'SUBSCRIPTION_LIMIT_REACHED',
      currentUsage: 25,
      limit: 25,
      tier: 'free'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify subscription limit message is displayed
    cy.contains('You have reached your monthly response limit').should('be.visible');
    cy.contains('Upgrade to Pro').should('be.visible');
  });

  it('should handle expired authentication tokens', () => {
    // Mock expired authentication
    cy.mockAuth({ expired: true });

    // Reload the page to trigger auth check
    cy.reload();

    // Verify user is redirected to login
    cy.url().should('include', '/login');
    cy.contains('Your session has expired').should('be.visible');
  });

  it('should handle network connectivity issues', () => {
    // Mock a network error
    cy.intercept('POST', '/api/openai', {
      forceNetworkError: true
    }).as('networkError');

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to fail
    cy.wait('@networkError');

    // Verify connectivity error message
    cy.contains('Unable to connect to the server').should('be.visible');
    cy.contains('Please check your internet connection').should('be.visible');
  });

  it('should allow editing the generated response', () => {
    // Mock a successful OpenAI API response
    cy.mockOpenAI();

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Edit the response
    cy.get('[data-testid="response-container"]').should('be.visible').click();
    cy.get('[data-testid="response-editor"]').should('be.visible').type(' This is an edit.');

    // Verify the edit is reflected
    cy.get('[data-testid="response-editor"]').should('contain', 'This is an edit.');
  });

  it('should allow copying the response to clipboard', () => {
    // Mock a successful OpenAI API response
    cy.mockOpenAI();

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Mock clipboard API
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    // Click copy button
    cy.get('[data-testid="copy-button"]').click();

    // Verify success message
    cy.contains('Copied to clipboard').should('be.visible');
  });

  it('should handle very long customer emails', () => {
    // Create a very long email
    const longEmail = 'Hello,\n'.repeat(100) + 'This is a very long email.';

    // Mock a successful OpenAI API response
    cy.mockOpenAI();

    // Generate a response with the long email
    cy.generateResponse({ email: longEmail });

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed
    cy.get('[data-testid="response-container"]').should('be.visible');
  });

  it('should use different tones for response generation', () => {
    // Test each tone option
    const tones = ['professional', 'friendly', 'formal', 'empathetic', 'concise'];

    tones.forEach(tone => {
      // Mock a successful OpenAI API response
      cy.mockOpenAI();

      // Generate a response with the specified tone
      cy.generateResponse({ tone });

      // Wait for the API call to complete
      cy.wait('@openaiResponse');

      // Verify the tone was passed in the request
      cy.get('@openaiResponse.all').then(interceptions => {
        const lastCall = interceptions[interceptions.length - 1];
        expect(lastCall.request.body.tone).to.equal(tone);
      });

      // Clear the response for the next test
      cy.get('[data-testid="reset-button"]').click();
    });
  });

  it('should test auto-generate feature when enabled', () => {
    // Enable auto-generate in settings (mock)
    cy.intercept('GET', '/api/user/settings', {
      autoGenerate: true
    }).as('userSettings');

    // Mock a successful OpenAI API response
    cy.mockOpenAI();

    // Just type the email without clicking generate
    cy.get('textarea[id="customerEmail"]').clear().type('Hello, this is a test email.{enter}');
    
    // Wait for auto-generate delay
    cy.wait(1000);

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed
    cy.get('[data-testid="response-container"]').should('be.visible');
  });

  it('should test keyboard shortcuts', () => {
    // Mock a successful OpenAI API response
    cy.mockOpenAI();

    // Type email
    cy.get('textarea[id="customerEmail"]').clear().type('Hello, this is a test email.');

    // Use keyboard shortcut to generate (Ctrl+Enter)
    cy.get('textarea[id="customerEmail"]').type('{ctrl+enter}');

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed
    cy.get('[data-testid="response-container"]').should('be.visible');

    // Use keyboard shortcut to copy (Ctrl+C when response is focused)
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });
    
    cy.get('[data-testid="response-container"]').focus().type('{ctrl+c}');
    
    // Verify success message
    cy.contains('Copied to clipboard').should('be.visible');
  });
}); 