import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import Auth from '../Auth';
import { supabase } from '../../lib/supabase';

// Mock the window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Integration test for authentication flow
describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
    // Clear any mocked timers
    jest.useRealTimers();
  });

  test('successful sign-in shows success message', async () => {
    // Mock successful sign in
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    // Render only the Auth component for this test
    render(<Auth />);
    
    // Fill in the authentication form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    
    // Verify that the Supabase signInWithPassword method was called with correct params
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/sign-in successful/i)).toBeInTheDocument();
    });
  });

  test('toggle between sign-in and sign-up views', () => {
    render(<Auth />);
    
    // Check we're on the sign-in view initially
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    
    // Click the sign-up link - using the actual text from the component
    fireEvent.click(screen.getByText('Sign up'));
    
    // Check we've switched to sign-up view
    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    
    // Click the sign-in link - using the actual text from the component
    fireEvent.click(screen.getByText('Sign in'));
    
    // Check we're back to sign-in view
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });
  
  test('displays validation errors on sign-up', async () => {
    // Mock error from sign-up attempt
    supabase.auth.signUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Password is too short (minimum 6 characters)' },
    });

    render(<Auth />);
    
    // Switch to sign-up view - using the actual text from the component
    fireEvent.click(screen.getByText('Sign up'));
    
    // Fill in the sign-up form with short password
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'newuser@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' }, // Too short password
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up$/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/password is too short/i)).toBeInTheDocument();
    });
  });
}); 