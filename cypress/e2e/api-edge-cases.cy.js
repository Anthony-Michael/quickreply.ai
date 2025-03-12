describe('API Edge Cases', () => {
  beforeEach(() => {
    // Mock successful authentication
    cy.mockAuth({ tier: 'business' });
    
    // Visit the email composer page
    cy.visit('/email-composer');
  });

  it('should handle OpenAI API timeout', () => {
    // Mock a timeout response
    cy.mockOpenAI({
      status: 504,
      error: 'Request timed out',
      errorCode: 'TIMEOUT_ERROR'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify timeout error message
    cy.contains('Request timed out').should('be.visible');
    cy.contains('Please try again').should('be.visible');
  });

  it('should handle OpenAI API rate limiting', () => {
    // Mock a rate limit error
    cy.mockOpenAI({
      status: 429,
      error: 'Too many requests. Please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify rate limit error message
    cy.contains('Too many requests').should('be.visible');
    cy.contains('Please try again later').should('be.visible');
  });

  it('should handle content policy violations', () => {
    // Mock a content policy violation
    cy.mockOpenAI({
      status: 400,
      error: 'Your request was rejected as it may violate our content policy',
      errorCode: 'CONTENT_POLICY_VIOLATION'
    });

    // Generate a response with potentially problematic content
    cy.generateResponse({
      email: 'This email contains content that might trigger a policy violation.'
    });

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify content policy error message
    cy.contains('content policy').should('be.visible');
    cy.contains('Please modify your request').should('be.visible');
  });

  it('should handle malformed API responses', () => {
    // Mock a malformed but valid response (missing required fields)
    cy.intercept('POST', '/api/openai', {
      statusCode: 200,
      body: {
        // Missing 'response' field
        businessName: 'Test Company'
      }
    }).as('malformedResponse');

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@malformedResponse');

    // Verify error handling for malformed response
    cy.contains('Error processing response').should('be.visible');
  });

  it('should handle empty API responses', () => {
    // Mock an empty response
    cy.intercept('POST', '/api/openai', {
      statusCode: 200,
      body: {}
    }).as('emptyResponse');

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@emptyResponse');

    // Verify error handling for empty response
    cy.contains('No response generated').should('be.visible');
  });

  it('should handle API server errors', () => {
    // Mock a server error
    cy.mockOpenAI({
      status: 500,
      error: 'Internal server error',
      errorCode: 'SERVER_ERROR'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify server error message
    cy.contains('Internal server error').should('be.visible');
    cy.contains('Please try again later').should('be.visible');
  });

  it('should handle network disconnection during API call', () => {
    // Mock a network error
    cy.intercept('POST', '/api/openai', {
      forceNetworkError: true
    }).as('networkError');

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to fail
    cy.wait('@networkError');

    // Verify connectivity error message
    cy.contains('Network error').should('be.visible');
    cy.contains('Please check your internet connection').should('be.visible');
  });

  it('should handle partial API responses', () => {
    // Mock a partial response (missing some fields but has required ones)
    cy.mockOpenAI({
      response: 'This is a partial response',
      // Missing businessName
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is still displayed
    cy.contains('This is a partial response').should('be.visible');
  });

  it('should handle extremely large API responses', () => {
    // Create a very large response (over 10,000 characters)
    const largeResponse = 'This is a very large response. '.repeat(500);
    
    // Mock a large response
    cy.mockOpenAI({
      response: largeResponse
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed (at least part of it)
    cy.contains('This is a very large response').should('be.visible');
    
    // Verify no performance issues or UI breakage
    cy.get('[data-testid="response-container"]').should('be.visible');
  });

  it('should handle multiple concurrent API requests', () => {
    // Mock two different responses with different delays
    cy.intercept('POST', '/api/openai', req => {
      if (req.body.customerEmail.includes('first')) {
        req.reply({
          statusCode: 200,
          body: {
            response: 'First response',
            businessName: 'Test Company'
          },
          delay: 1000
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            response: 'Second response',
            businessName: 'Test Company'
          },
          delay: 500
        });
      }
    }).as('multipleRequests');

    // Generate first response
    cy.generateResponse({
      email: 'This is the first request'
    });
    
    // Quickly generate second response without waiting
    cy.generateResponse({
      email: 'This is the second request'
    });

    // Wait for both requests to complete
    cy.wait('@multipleRequests');
    cy.wait('@multipleRequests');

    // Verify only the second (most recent) response is displayed
    cy.contains('Second response').should('be.visible');
    cy.contains('First response').should('not.exist');
  });

  it('should handle API request with special characters and HTML', () => {
    // Mock a response with HTML and special characters
    cy.mockOpenAI({
      response: '<b>Bold text</b> & special characters like © ® ™ € £ ¥'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed correctly (HTML escaped)
    cy.get('[data-testid="response-container"]').should('contain', '<b>Bold text</b>');
    cy.get('[data-testid="response-container"]').should('contain', '© ® ™ € £ ¥');
  });

  it('should handle API response with non-ASCII characters', () => {
    // Mock a response with international characters
    cy.mockOpenAI({
      response: 'International characters: こんにちは 你好 안녕하세요 مرحبا Привет'
    });

    // Generate a response
    cy.generateResponse();

    // Wait for the API call to complete
    cy.wait('@openaiResponse');

    // Verify the response is displayed correctly
    cy.get('[data-testid="response-container"]').should('contain', 'こんにちは');
    cy.get('[data-testid="response-container"]').should('contain', '你好');
    cy.get('[data-testid="response-container"]').should('contain', '안녕하세요');
  });
}); 