import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { supabase } from '../../lib/supabase';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid='responsive-container'>{children}</div>,
  LineChart: ({ children }) => <div data-testid='line-chart'>{children}</div>,
  BarChart: ({ children }) => <div data-testid='bar-chart'>{children}</div>,
  PieChart: ({ children }) => <div data-testid='pie-chart'>{children}</div>,
  Line: () => <div data-testid='line' />,
  Bar: () => <div data-testid='bar' />,
  Pie: () => <div data-testid='pie' />,
  Cell: () => <div data-testid='cell' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='cartesian-grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Legend: () => <div data-testid='legend' />,
}));

// Mock profile data for tests
const mockProfileData = {
  id: 'profile-id',
  user_id: 'test-user-id',
  email: 'test@example.com',
  business_name: 'Test Business',
  business_description: 'Test Description',
  monthly_responses_limit: 100,
  monthly_responses_used: 25,
  subscription_tier: 'pro',
};

// Mock email history data
const mockEmailHistoryData = Array(10)
  .fill()
  .map((_, i) => ({
    id: `email-${i}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    tone_requested: ['professional', 'friendly', 'formal', 'empathetic'][
      Math.floor(Math.random() * 4)
    ],
    customer_email_subject: `Test Email ${i + 1}`,
  }));

// Mock supabase client
jest.mock('../../lib/supabase', () => {
  // Create profile select mock that returns the expected data
  const profileSelectMock = jest.fn().mockReturnThis();
  const profileEqMock = jest.fn().mockReturnThis();
  const profileSingleMock = jest.fn().mockResolvedValue({
    data: mockProfileData,
    error: null,
  });

  // Create email history select mock
  const historySelectMock = jest.fn().mockReturnThis();
  const historyEqMock = jest.fn().mockReturnThis();
  const historyGteMock = jest.fn().mockReturnThis();
  const historyOrderMock = jest.fn().mockResolvedValue({
    data: mockEmailHistoryData,
    error: null,
  });

  // Create from mock that returns different chains based on table name
  const fromMock = jest.fn().mockImplementation((tableName) => {
    if (tableName === 'profiles') {
      return {
        select: profileSelectMock,
        eq: profileEqMock,
        single: profileSingleMock,
      };
    } else if (tableName === 'email_history') {
      return {
        select: historySelectMock,
        eq: historyEqMock,
        gte: historyGteMock,
        order: historyOrderMock,
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

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard header', async () => {
    render(<Dashboard />);

    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  test('renders profile information when loaded', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/test business/i)).toBeInTheDocument();
      expect(screen.getByText(/test description/i)).toBeInTheDocument();
    });
  });

  test('renders usage statistics', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/responses used/i)).toBeInTheDocument();
      expect(screen.getByText(/25\/100/i)).toBeInTheDocument(); // 25 used out of 100 limit
    });
  });

  test('renders charts', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/email activity/i)).toBeInTheDocument();
      expect(screen.getByText(/tone distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/response time/i)).toBeInTheDocument();

      // Check if chart containers are rendered
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    });
  });

  test('handles error when loading profile', async () => {
    // Override the mock to simulate an error for this test only
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
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockEmailHistoryData,
          error: null,
        }),
      };
    });

    render(<Dashboard />);

    // Should display error message or fall back to mock data
    await waitFor(() => {
      expect(screen.getByText(/mock data/i)).toBeInTheDocument();
    });
  });
});
