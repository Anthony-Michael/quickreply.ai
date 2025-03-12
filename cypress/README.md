# QuickReply.ai Cypress Testing

This directory contains Cypress tests for the QuickReply.ai application. The tests are designed to cover various aspects of the application, including:

- Email composition and AI response generation
- Authentication and session management
- API edge cases and error handling

## Test Structure

The tests are organized into the following files:

- `e2e/email-composer.cy.js`: Tests for the email composer component and AI response generation
- `e2e/auth-edge-cases.cy.js`: Tests for authentication edge cases
- `e2e/api-edge-cases.cy.js`: Tests for API edge cases related to OpenAI integration

## Custom Commands

We've created several custom Cypress commands to make testing more efficient:

### Authentication Commands

```javascript
// Mock authentication with various options
cy.mockAuth({
  tier: 'free',           // Subscription tier ('free', 'business', 'premium', 'trial')
  responsesUsed: 5,       // Number of responses used
  responsesLimit: 25,     // Total response limit
  expired: false          // Whether the token is expired
});
```

### OpenAI API Commands

```javascript
// Mock OpenAI API response with various options
cy.mockOpenAI({
  status: 200,                      // HTTP status code
  response: 'AI-generated response', // Generated response text
  businessName: 'Test Company',     // Business name
  error: null,                      // Error message
  errorCode: null,                  // Error code
  delay: 0                          // Response delay in ms
});
```

### Email Composer Commands

```javascript
// Fill and submit the email composer form
cy.generateResponse({
  email: 'Hello, this is a test email.',  // Customer email content
  context: '',                           // Business context
  tone: 'professional'                   // Response tone
});
```

## Running the Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm run cypress:run

# Open Cypress Test Runner
npm run cypress:open
```

## Test Coverage

The tests cover the following scenarios:

### Email Composer Tests
- Rendering the email composer form
- Input validation
- Successful AI response generation
- Error handling (API errors, subscription limits, etc.)
- Editing generated responses
- Copying responses to clipboard
- Handling long customer emails
- Testing different tones
- Auto-generate feature
- Keyboard shortcuts

### Authentication Edge Cases
- Redirecting to login when accessing protected pages without authentication
- Handling expired tokens
- Managing invalid login credentials
- Session maintenance and refresh
- Logout functionality
- Rate limiting on login attempts
- Server errors during authentication

### API Edge Cases
- OpenAI API timeout
- Rate limiting
- Content policy violations
- Malformed API responses
- Empty API responses
- Server errors
- Network disconnection
- Partial API responses
- Extremely large API responses
- Multiple concurrent API requests
- Special characters and HTML in responses
- Non-ASCII characters in responses

## Best Practices

When writing tests:

1. Use custom commands whenever possible to keep tests DRY
2. Mock API responses to test edge cases without relying on external services
3. Test both happy paths and error scenarios
4. Use meaningful assertions that verify the user experience
5. Keep tests independent of each other
6. Use descriptive test names that explain what is being tested

## Adding New Tests

To add new tests:

1. Create a new file in the `e2e` directory or add to an existing file
2. Use the custom commands to set up the test environment
3. Write assertions that verify the expected behavior
4. Run the tests to ensure they pass 