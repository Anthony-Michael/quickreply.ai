// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the Supabase client
jest.mock('./lib/supabase', () => {
  // Create a more sophisticated mock with chainable methods
  const mockFromReturn = {
    select: jest.fn(() => mockFromReturn),
    insert: jest.fn(() => mockFromReturn),
    update: jest.fn(() => mockFromReturn),
    delete: jest.fn(() => mockFromReturn),
    eq: jest.fn(() => mockFromReturn),
    single: jest.fn(() => Promise.resolve({
      data: {
        id: 'profile-id',
        user_id: 'test-user-id',
        email: 'test@example.com',
        business_name: 'Test Business',
        business_description: 'Test Description',
        monthly_responses_limit: 100,
        monthly_responses_used: 25,
        subscription_tier: 'pro',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      error: null,
    })),
    match: jest.fn(() => mockFromReturn),
    order: jest.fn(() => mockFromReturn),
    limit: jest.fn(() => Promise.resolve({
      data: [
        { 
          id: 'template-id-1', 
          template_name: 'Template 1', 
          template_content: 'Template content 1',
          created_at: new Date().toISOString(),
        },
        { 
          id: 'template-id-2', 
          template_name: 'Template 2', 
          template_content: 'Template content 2',
          created_at: new Date().toISOString(),
        }
      ],
      error: null,
    })),
  };

  // Create subscription mock
  const subscriptionMock = {
    unsubscribe: jest.fn()
  };

  // Create auth mock with all required methods
  const authMock = {
    getSession: jest.fn().mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'test-user-id', email: 'test@example.com' } 
        } 
      },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { 
        user: { id: 'test-user-id', email: 'test@example.com' } 
      },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: { id: 'new-user-id', email: 'newuser@example.com' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: subscriptionMock },
    })),
    resetPasswordForEmail: jest.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
  };

  return {
    supabase: {
      auth: authMock,
      from: jest.fn(() => mockFromReturn),
    },
  };
});

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
console.error = jest.fn((...args) => {
  // Filter out specific React errors that would clutter the test output
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning:') || 
     args[0].includes('Error loading dashboard data') ||
     args[0].includes('Error loading subscription data'))
  ) {
    return;
  }
  originalConsoleError(...args);
}); 