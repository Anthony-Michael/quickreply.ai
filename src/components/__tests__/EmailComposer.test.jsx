import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailComposer from '../EmailComposer';
import { generateEmailResponse } from '../../lib/openai';
import { supabase } from '../../lib/supabase';

// Mock the openai.js module
jest.mock('../../lib/openai', () => ({
  generateEmailResponse: jest.fn(),
}));

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          { id: 1, template_name: 'Template 1', template_content: 'Template content 1' },
          { id: 2, template_name: 'Template 2', template_content: 'Template content 2' },
        ],
        error: null,
      }),
    }),
  },
}));

describe('EmailComposer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email composer form', () => {
    render(<EmailComposer />);

    expect(screen.getByText(/generate email response/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customer email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate response/i })).toBeInTheDocument();
  });

  test('displays error when generating response without email', async () => {
    render(<EmailComposer />);

    // Click generate without entering email
    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Check for error message
    expect(screen.getByText(/please paste a customer email/i)).toBeInTheDocument();
  });

  test('generates email response successfully', async () => {
    // Mock successful response generation
    const mockResponse = 'This is a test generated response.';
    generateEmailResponse.mockResolvedValueOnce(mockResponse);

    render(<EmailComposer />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'Hello, I have a question about your product.' },
    });

    fireEvent.change(screen.getByLabelText(/business context/i), {
      target: { value: 'We sell software products.' },
    });

    // Select tone
    fireEvent.change(screen.getByLabelText(/tone/i), {
      target: { value: 'friendly' },
    });

    // Click generate
    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Check that the openai function was called with correct arguments
    expect(generateEmailResponse).toHaveBeenCalledWith(
      'Hello, I have a question about your product.',
      'We sell software products.',
      'friendly'
    );

    // Wait for response to be generated
    await waitFor(() => {
      expect(screen.getByText(/response generated successfully/i)).toBeInTheDocument();
      expect(screen.getByText(mockResponse)).toBeInTheDocument();
    });
  });

  test('handles error during response generation', async () => {
    // Mock error during generation
    generateEmailResponse.mockRejectedValueOnce(new Error('API error'));

    render(<EmailComposer />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'Hello, I have a question about your product.' },
    });

    // Click generate
    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  test('allows editing of generated response', async () => {
    // Mock successful response generation
    const mockResponse = 'This is a test generated response.';
    generateEmailResponse.mockResolvedValueOnce(mockResponse);

    render(<EmailComposer />);

    // Fill in the form and generate response
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'Hello, I have a question about your product.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Wait for response to be generated
    await waitFor(() => {
      expect(screen.getByText(mockResponse)).toBeInTheDocument();
    });

    // Edit the response
    fireEvent.change(screen.getByLabelText(/generated response/i), {
      target: { value: 'This is my edited response.' },
    });

    // Check that the edited text is displayed
    expect(screen.getByDisplayValue('This is my edited response.')).toBeInTheDocument();
  });

  // NEW TESTS BELOW

  test('different tones affect the API call', async () => {
    // Mock successful response generation
    generateEmailResponse.mockResolvedValue('Response with professional tone');

    render(<EmailComposer />);

    // Fill in the form with professional tone
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'Test email' },
    });

    fireEvent.change(screen.getByLabelText(/tone/i), {
      target: { value: 'professional' },
    });

    // Click generate
    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Wait for the button to be disabled (loading state)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    });

    // Wait for the button to be enabled again
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /generating/i })).not.toBeInTheDocument();
    });

    // Check that tone was passed correctly
    expect(generateEmailResponse).toHaveBeenCalledWith('Test email', '', 'professional');

    // Clear mocks
    jest.clearAllMocks();
    generateEmailResponse.mockResolvedValue('Response with friendly tone');

    // Change tone to friendly
    fireEvent.change(screen.getByLabelText(/tone/i), {
      target: { value: 'friendly' },
    });

    // Click generate again - find the button by its text
    fireEvent.click(screen.getByText(/regenerate/i));

    // Wait for the new response to be generated
    await waitFor(() => {
      expect(generateEmailResponse).toHaveBeenCalledWith('Test email', '', 'friendly');
    });
  });

  test('handles very long customer emails gracefully', async () => {
    // Create a very long email (over 1000 characters)
    const longEmail = 'A'.repeat(1500);
    generateEmailResponse.mockResolvedValueOnce('Response to long email');

    render(<EmailComposer />);

    // Fill in the form with long email
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: longEmail },
    });

    // Click generate
    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Check that the function was called with the full email
    expect(generateEmailResponse).toHaveBeenCalledWith(longEmail, '', 'professional');

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/response generated successfully/i)).toBeInTheDocument();
    });
  });

  test('resets state properly when generating a new response', async () => {
    // Mock successful responses
    generateEmailResponse.mockResolvedValueOnce('First response');

    render(<EmailComposer />);

    // Generate first response
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'First email' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Wait for first response
    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument();
    });

    // Mock second response
    generateEmailResponse.mockResolvedValueOnce('Second response');

    // Generate second response
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'Second email' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generate response/i }));

    // Verify loading state is active
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();

    // Wait for second response to replace first
    await waitFor(() => {
      expect(screen.queryByText('First response')).not.toBeInTheDocument();
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });
  });
});
