import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Auth from '../Auth';
import { supabase } from '../../lib/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

describe('Auth Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };
  });

  test('renders sign in form by default', () => {
    render(<Auth />);
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('can switch to sign up view', () => {
    render(<Auth />);
    
    // Click on the "Sign up" link (not button)
    fireEvent.click(screen.getByText('Sign up'));
    
    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('handles sign in submission', async () => {
    // Mock successful sign in
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });
    
    // Mock setTimeout to execute immediately
    jest.useFakeTimers();

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
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/sign-in successful/i)).toBeInTheDocument();
    });
    
    // Fast-forward timers so the redirect happens
    jest.runAllTimers();
    
    // Check window.location directly
    expect(window.location.href).toBe('/dashboard');
    
    // Restore timers
    jest.useRealTimers();
  });

  test('handles sign in error', async () => {
    // Mock sign in error
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    render(<Auth />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });
}); 