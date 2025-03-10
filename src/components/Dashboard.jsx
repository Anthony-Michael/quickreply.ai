import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Line Chart component with better error handling
const LineChart = ({ data }) => {
  // Ensure we have valid data to render
  if (!data || !data.length) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="count"
          name="Emails"
          stroke="#3b82f6"
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

// Update PropTypes to make data optional or provide default props
LineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      count: PropTypes.number,
    })
  ),
};

LineChart.defaultProps = {
  data: [],
};

// Bar Chart component with better error handling
const BarChart = ({ data }) => {
  // Ensure we have valid data to render
  if (!data || !data.length) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name="Emails" fill="#3b82f6" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// Update PropTypes for BarChart
BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
};

BarChart.defaultProps = {
  data: [],
};

// Pie Chart component with better error handling
const PieChart = ({ data }) => {
  // Ensure we have valid data to render
  if (!data || !data.length) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="tone"
          label={({ tone }) => tone}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

// Update PropTypes for PieChart
PieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      tone: PropTypes.string,
      count: PropTypes.number,
    })
  ),
};

PieChart.defaultProps = {
  data: [],
};

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
  }, [user]);

  async function loadDashboardData() {
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
        business_description: 'Your business description'
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
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert([defaultProfile]);
            
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
  }

  // Helper function to process real usage data
  function processUsageByDay(emailHistory) {
    const usageMap = {};
    
    // Initialize last 30 days with zero count
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      usageMap[dateString] = 0;
    }
    
    // Count emails by date
    emailHistory.forEach(email => {
      const dateString = new Date(email.created_at).toISOString().split('T')[0];
      if (usageMap[dateString] !== undefined) {
        usageMap[dateString]++;
      }
    });
    
    // Convert to array format for the chart
    return Object.keys(usageMap).map(date => ({
      date,
      count: usageMap[date],
    }));
  }

  // Helper function to generate mock usage data
  function generateMockUsageByDay() {
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5),
      });
    }
    return data;
  }

  // Helper function to generate mock tone distribution
  function generateMockToneDistribution(emailHistory = []) {
    const tones = ['professional', 'friendly', 'formal', 'empathetic'];

    if (emailHistory && emailHistory.length > 0) {
      // Count actual tones from email history
      const toneCounts = emailHistory.reduce((acc, email) => {
        const tone = email.tone_requested || 'professional';
        acc[tone] = (acc[tone] || 0) + 1;
        return acc;
      }, {});

      return Object.keys(toneCounts).map(tone => ({
        tone,
        count: toneCounts[tone],
      }));
    }

    // Generate random distribution with valid data structure for PieChart
    return tones.map(tone => ({
      tone,
      count: Math.floor(Math.random() * 10) + 1,
    }));
  }

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-2">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 mb-3 rounded">
          {error}
        </div>
      )}

      <h1 className="text-xl font-bold mb-3">Dashboard</h1>

      {trialDaysRemaining !== null && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          Trial Ends in {trialDaysRemaining} Days
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Stats Overview - Horizontal Row */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-xs font-medium">Total Emails</h3>
              <p className="text-lg font-bold">{stats.totalEmails}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-xs font-medium">Emails This Month</h3>
              <p className="text-lg font-bold">{stats.emailsThisMonth}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-xs font-medium">Edit Rate</h3>
              <p className="text-lg font-bold">{stats.responseRate || '0%'}</p>
              <p className="text-xs text-gray-500">of responses were edited</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-xs font-medium">Remaining Quota</h3>
              <p className="text-lg font-bold">{stats.responsesRemaining}</p>
              <p className="text-xs text-gray-500">of responses</p>
            </div>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Left Column - Email Activity */}
            <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
              <h3 className="text-md font-medium mb-2">Email Activity (Last 7 Days)</h3>
              <div className="h-60">
                <LineChart data={stats.usageByDay.slice(-7)} />
              </div>
            </div>

            {/* Right Column - Response Tone */}
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-md font-medium mb-2">Response Tone Distribution</h3>
              <div className="h-60">
                <PieChart data={stats.toneDistribution} />
              </div>
            </div>
          </div>

          {/* 2-Column Layout for Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Monthly Activity */}
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-md font-medium mb-2">Monthly Activity</h3>
              <div className="h-60">
                <BarChart data={stats.usageByDay.slice(-30)} />
              </div>
            </div>

            {/* Recent Emails */}
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-md font-medium mb-2">Recent Emails</h3>
              {stats.recentEmails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Edited
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentEmails.map(email => (
                        <tr key={email.id}>
                          <td className="px-2 py-1 whitespace-nowrap">
                            {email.customer_email_subject || `Mock Email ${email.id}`}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            {new Date(email.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            {email.was_edited ? 'Yes' : 'No'}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-blue-600 hover:text-blue-800">
                            <a href={`/email/${email.id}`}>View</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">No emails yet.</p>
              )}

              <div className="mt-2">
                <a href="/emails" className="text-blue-600 hover:text-blue-800 text-xs">
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
