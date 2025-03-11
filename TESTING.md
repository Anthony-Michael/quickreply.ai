# Testing in QuickReply AI

This document outlines the testing setup and practices for the QuickReply AI application.

## Testing Stack

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **MSW (Mock Service Worker)**: API mocking library

## Test Structure

Tests are organized in the following structure:

```
src/
  components/
    __tests__/
      Auth.test.jsx
      Dashboard.test.jsx
      EmailComposer.test.jsx
      SubscriptionManagement.test.jsx
  __mocks__/
    styleMock.js
    fileMock.js
    openaiMock.js
```

## Running Tests

The following npm scripts are available for running tests:

- `npm test`: Run tests in watch mode (default)
- `npm run test:ci`: Run tests in CI mode (no watch)
- `npm run test:coverage`: Generate test coverage report
- `npm run test:watch`: Run tests in watch mode (explicit)

## Mocking

### Supabase

Supabase client is mocked in `src/setupTests.js` to provide consistent test behavior without requiring an actual Supabase connection.

### OpenAI

OpenAI API calls are mocked in `src/__mocks__/openaiMock.js`.

### Static Assets

- CSS and other style imports are mocked with `src/__mocks__/styleMock.js`
- Images and other file imports are mocked with `src/__mocks__/fileMock.js`

## Test Examples

### Component Tests

Component tests verify that components render correctly and respond to user interactions as expected.

Example from `Auth.test.jsx`:

```jsx
test('renders sign in form by default', () => {
  render(<Auth />);
  
  expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
```

### Interaction Tests

Interaction tests simulate user actions and verify the expected outcomes.

Example from `Auth.test.jsx`:

```jsx
test('handles sign in submission', async () => {
  // Mock successful sign in
  supabase.auth.signInWithPassword.mockResolvedValueOnce({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null,
  });

  render(<Auth />);
  
  // Fill in the form
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' },
  });
  
  // Submit the form
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  // Check that the supabase function was called with correct arguments
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
  
  // Wait for success message and redirection
  await waitFor(() => {
    expect(screen.getByText(/sign-in successful/i)).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on testing what the component does, not how it's implemented.
2. **Use Realistic User Interactions**: Test components using the same actions a user would perform.
3. **Mock External Dependencies**: Use mocks for external services like Supabase and OpenAI.
4. **Keep Tests Independent**: Each test should be able to run independently of others.
5. **Test Error States**: Test how components handle errors, not just successful operations.

## Troubleshooting

If tests are failing, check the following:

1. Ensure mocks are properly set up in `setupTests.js`
2. Verify that component selectors match the actual rendered content
3. For async tests, make sure to use `waitFor` or `findBy` queries
4. Check console errors for additional information 