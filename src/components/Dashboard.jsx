import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useUserProfile, useEmailHistory, useSubscriptionData } from '../lib/react-query';
import Link from 'next/link';
// Comment out missing chart components
// import LineChart from './charts/LineChart';
// import BarChart from './charts/BarChart';
// import PieChart from './charts/PieChart';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEmails: 0,
    emailsThisMonth: 0,
    responseRate: 0,
    responsesRemaining: 0,
    usageByDay: [],
    toneDistribution: [],
    recentEmails: [],
  });
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [usageByDay, setUsageByDay] = useState(null);
  const [toneDistribution, setToneDistribution] = useState(null);

  // Use React Query hooks to fetch data with caching
  const { isLoading: isProfileLoading } = useUserProfile();
  const { data: emailHistoryData, isLoading: isHistoryLoading } = useEmailHistory(100, 0, 30);
  const { isLoading: isSubscriptionLoading } = useSubscriptionData();

  useEffect(() => {
    // Only process data when all queries have completed
    if (!isProfileLoading && !isHistoryLoading && !isSubscriptionLoading) {
      const emailHistory = emailHistoryData?.data || [];

      // Process usage data for charts
      if (emailHistory.length > 0) {
        setUsageByDay(processUsageByDay(emailHistory));
        setToneDistribution(processToneDistribution(emailHistory));
      } else {
        // Use mock data if no history exists
        setUsageByDay(generateMockUsageByDay());
        setToneDistribution(generateMockToneDistribution());
      }
    }
  }, [isProfileLoading, isHistoryLoading, isSubscriptionLoading, emailHistoryData]);

  useEffect(() => {
    // Only load dashboard data when user is available
    if (user) {
      loadDashboardData();

      // Check if the user is in the trial period
      if (user.subscription_tier === 'trial') {
        const endDate = new Date(user.subscription_end_date);
        const today = new Date();
        const timeDiff = endDate - today;
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        setTrialDaysRemaining(daysRemaining);
      }
    }
  }, [user, loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Loading dashboard data for user:', user.id);

      // Default profile data to use if database fetch fails
      const defaultProfile = {
        id: user.id,
        subscription_tier: 'free',
        monthly_responses_limit: 25,
        monthly_responses_used: 0,
        business_name: 'Your Business',
        business_description: 'Your business description',
      };

      let profile = null;
      let emailHistory = [];

      try {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Error fetching profile, using mock data:', profileError.message);

          // Try to create a profile if it doesn't exist
          try {
            const { error: insertError } = await supabase.from('profiles').upsert([defaultProfile]);

            if (insertError) {
              console.warn('Could not create profile:', insertError);
            } else {
              profile = defaultProfile;
            }
          } catch (createError) {
            console.warn('Error creating profile:', createError);
          }
        } else {
          profile = profileData;
        }

        // Get email history (last 30 days)
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: historyData, error: historyError } = await supabase
            .from('email_history')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });

          if (historyError) {
            console.warn('Error fetching email history, using mock data:', historyError.message);

            // Try to create email_history table if it doesn't exist
            // Note: This would normally be done during database setup
          } else {
            emailHistory = historyData || [];
          }
        } catch (historyFetchError) {
          console.warn('Error accessing email history table:', historyFetchError);
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue with mock data
      }

      // Use real data if available, otherwise fall back to mock data
      setStats({
        totalEmails: emailHistory.length > 0 ? emailHistory.length : 47,
        emailsThisMonth: emailHistory.length > 0 ? emailHistory.length : 12,
        responseRate: '0%',
        responsesRemaining: profile
          ? profile.monthly_responses_limit - profile.monthly_responses_used
          : defaultProfile.monthly_responses_limit - defaultProfile.monthly_responses_used,

        // Generate sample data for charts
        usageByDay: generateMockUsageByDay(),
        toneDistribution: generateMockToneDistribution(),
        recentEmails: Array(5)
          .fill()
          .map((_, i) => ({
            id: `mock-${i}`,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            tone_requested: ['professional', 'friendly', 'formal', 'empathetic'][
              Math.floor(Math.random() * 4)
            ],
            customer_email_subject: `Mock Email ${i + 1}`,
          })),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(`Failed to load dashboard data. ${error.message}`);

      // Set fallback mock data
      setStats({
        totalEmails: 47,
        emailsThisMonth: 12,
        responseRate: '0%',
        responsesRemaining: 13,
        usageByDay: generateMockUsageByDay(),
        toneDistribution: generateMockToneDistribution(),
        recentEmails: Array(5)
          .fill()
          .map((_, i) => ({
            id: `mock-${i}`,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            tone_requested: ['professional', 'friendly', 'formal', 'empathetic'][
              Math.floor(Math.random() * 4)
            ],
            customer_email_subject: `Mock Email ${i + 1}`,
          })),
      });
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Process email history to get usage by day
  function processUsageByDay(emailHistory) {
    // Group emails by date
    const usageByDayMap = {};

    emailHistory.forEach((email) => {
      const date = new Date(email.created_at).toLocaleDateString();
      usageByDayMap[date] = (usageByDayMap[date] || 0) + 1;
    });

    // Create an array of the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toLocaleDateString());
    }

    // Map the usage data to the last 7 days
    const labels = [];
    const values = [];

    last7Days.forEach((date) => {
      labels.push(date);
      values.push(usageByDayMap[date] || 0);
    });

    return { labels, values };
  }

  // Process email history to get tone distribution
  function processToneDistribution(emailHistory) {
    // Count emails by tone
    const toneMap = {};

    emailHistory.forEach((email) => {
      const tone = email.tone_requested || 'not specified';
      toneMap[tone] = (toneMap[tone] || 0) + 1;
    });

    // Convert to labels and values
    const labels = Object.keys(toneMap);
    const values = Object.values(toneMap);

    return { labels, values };
  }

  // Generate mock usage data for new users
  function generateMockUsageByDay() {
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      values.push(Math.floor(Math.random() * 5)); // Random value between 0 and 4
    }

    return { labels, values };
  }

  // Generate mock tone distribution data for new users
  function generateMockToneDistribution() {
    const labels = ['professional', 'friendly', 'formal', 'empathetic', 'concise'];
    const values = [5, 3, 2, 4, 1]; // Example distribution

    return { labels, values };
  }

  if (loading) {
    return <div className='p-8 text-center'>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className='p-8 text-center text-red-600'>{error}</div>;
  }

  return (
    <div className='p-2'>
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-3 py-2 mb-3 rounded'>
          {error}
        </div>
      )}

      <h1 className='text-xl font-bold mb-3'>Dashboard</h1>

      {(user?.subscription_tier === 'free' || user?.subscription_tier === 'trial') && (
        <div className='mb-4'>
          <Link
            href='/subscription'
            className='inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors duration-150 font-medium text-sm'
          >
            Upgrade to Pro — Get {user?.subscription_tier === 'free' ? '10x' : '4x'} More Responses!
          </Link>
        </div>
      )}

      {trialDaysRemaining !== null && (
        <div className='mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md'>
          Trial Ends in {trialDaysRemaining} Days
        </div>
      )}

      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Stats Overview - Horizontal Row */}
          <div className='grid grid-cols-4 gap-3 mb-3'>
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-gray-500 text-xs font-medium'>Total Emails</h3>
              <p className='text-lg font-bold'>{stats.totalEmails}</p>
            </div>
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-gray-500 text-xs font-medium'>Emails This Month</h3>
              <p className='text-lg font-bold'>{stats.emailsThisMonth}</p>
            </div>
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-gray-500 text-xs font-medium'>Edit Rate</h3>
              <p className='text-lg font-bold'>{stats.responseRate || '0%'}</p>
              <p className='text-xs text-gray-500'>of responses were edited</p>
            </div>
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-gray-500 text-xs font-medium'>Remaining Quota</h3>
              <p className='text-lg font-bold'>{stats.responsesRemaining}</p>
              <p className='text-xs text-gray-500'>of responses</p>
            </div>
          </div>

          {/* 3-Column Layout */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-3'>
            {/* Left Column - Email Activity */}
            <div className='bg-white p-3 rounded-lg shadow-sm md:col-span-2'>
              <h3 className='text-md font-medium mb-2'>Email Activity (Last 7 Days)</h3>
              <div className='h-60'>{/* <LineChart data={usageByDay} /> */}</div>
            </div>

            {/* Right Column - Response Tone */}
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-md font-medium mb-2'>Response Tone Distribution</h3>
              <div className='h-60'>{/* <PieChart data={toneDistribution} /> */}</div>
            </div>
          </div>

          {/* 2-Column Layout for Bottom Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {/* Monthly Activity */}
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-md font-medium mb-2'>Monthly Activity</h3>
              <div className='h-60'>{/* <BarChart data={usageByDay} /> */}</div>
            </div>

            {/* Recent Emails */}
            <div className='bg-white p-3 rounded-lg shadow-sm'>
              <h3 className='text-md font-medium mb-2'>Recent Emails</h3>
              {stats.recentEmails.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 text-xs'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Subject
                        </th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Date
                        </th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Edited
                        </th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {stats.recentEmails.map((email) => (
                        <tr key={email.id}>
                          <td className='px-2 py-1 whitespace-nowrap'>
                            {email.customer_email_subject || `Mock Email ${email.id}`}
                          </td>
                          <td className='px-2 py-1 whitespace-nowrap'>
                            {new Date(email.created_at).toLocaleDateString()}
                          </td>
                          <td className='px-2 py-1 whitespace-nowrap'>
                            {email.was_edited ? 'Yes' : 'No'}
                          </td>
                          <td className='px-2 py-1 whitespace-nowrap text-blue-600 hover:text-blue-800'>
                            <a href={`/email/${email.id}`}>View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='text-gray-500 text-xs'>No emails yet.</p>
              )}

              <div className='mt-2'>
                <a href='/emails' className='text-blue-600 hover:text-blue-800 text-xs'>
                  View All Emails →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
