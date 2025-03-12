import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionManagement from '../SubscriptionManagement';
import { supabase } from '../../lib/supabase';

// Mock profile data for tests
const mockProfileData = {
  id: 'profile-id',
  user_id: 'test-user-id',
  email: 'test@example.com',
  subscription_tier: 'pro',
  subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  monthly_responses_limit: 100,
  monthly_responses_used: 25,
};

// Mock the supabase module
jest.mock('../../lib/supabase', () => {
  // Create profile select mock
  const profileSelectMock = jest.fn().mockReturnThis();
  const profileEqMock = jest.fn().mockReturnThis();
  const profileSingleMock = jest.fn().mockResolvedValue({
    data: mockProfileData,
    error: null,
  });

  // Create insert and update mocks
  const insertMock = jest.fn().mockReturnThis();
  const updateMock = jest.fn().mockReturnThis();
  const updateEqMock = jest.fn().mockResolvedValue({
    data: { ...mockProfileData, subscription_tier: 'business' },
    error: null,
  });

  // Create from mock that handles different method chains
  const fromMock = jest.fn().mockImplementation((tableName) => {
    if (tableName === 'profiles') {
      return {
        select: profileSelectMock,
        eq: profileEqMock,
        single: profileSingleMock,
        insert: insertMock,
        update: updateMock,
      };
    }
    return {};
  });

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
      from: fromMock,
    },
  };
});

describe('SubscriptionManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert
    window.alert = jest.fn();
  });

  test('renders subscription management page', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/subscription management/i)).toBeInTheDocument();
    });
  });

  test('displays current subscription details', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/current plan/i)).toBeInTheDocument();
      expect(screen.getByText(/pro/i)).toBeInTheDocument();
      expect(screen.getByText(/100 responses per month/i)).toBeInTheDocument();
    });
  });

  test('displays available plans', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/available plans/i)).toBeInTheDocument();
      expect(screen.getAllByText(/free/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/pro/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/business/i).length).toBeGreaterThan(0);
    });
  });

  test('handles plan upgrade click', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/available plans/i)).toBeInTheDocument();
    });

    // Find and click a plan upgrade button
    const upgradeButtons = screen.getAllByText(/upgrade/i);
    fireEvent.click(upgradeButtons[0]);

    // Should show alert in mock environment
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
    });
  });

  test('displays FAQ section', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
      expect(screen.getByText(/how do i upgrade my plan/i)).toBeInTheDocument();
      expect(screen.getByText(/what happens if i reach my monthly limit/i)).toBeInTheDocument();
    });
  });

  test('handles error when loading profile', async () => {
    // Override the mock to simulate an error
    const errorMock = jest.fn().mockResolvedValueOnce({
      data: null,
      error: { message: 'Error loading profile' },
    });

    // Override the from implementation just for this test
    supabase.from.mockImplementationOnce((tableName) => {
      if (tableName === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: errorMock,
        };
      }
      return {};
    });

    render(<SubscriptionManagement />);

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
    });
  });
});
