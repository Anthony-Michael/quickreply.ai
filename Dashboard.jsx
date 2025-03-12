import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, BarChart, PieChart } from 'your-chart-library'; // Replace with actual chart library from Lovable.dev

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({
    totalEmails: 0,
    emailsThisMonth: 0,
    responseRate: 0,
    remainingQuota: 0,
    usageByDay: [],
    toneDistribution: []
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        // Load user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setUserProfile(profile);
        
        // Calculate remaining quota
        const remainingQuota = profile.monthly_responses_limit - profile.monthly_responses_used;
        
        // Get total emails count
        const { count: totalEmails, error: countError } = await supabase
          .from('email_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (countError) throw countError;
        
        // Get emails this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const { count: emailsThisMonth, error: monthCountError } = await supabase
          .from('email_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', firstDayOfMonth.toISOString());
          
        if (monthCountError) throw monthCountError;
        
        // Get recent emails
        const { data: recent, error: recentError } = await supabase
          .from('email_history')
          .select('id, created_at, customer_email_subject, was_edited')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentError) throw recentError;
        setRecentEmails(recent);
        
        // Get usage by day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Generate array of last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }).reverse();
        
        // Get email count by day
        const { data: dailyData, error: dailyError } = await supabase
          .from('email_history')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());
          
        if (dailyError) throw dailyError;
        
        // Process daily data
        const dailyCounts = {};
        last7Days.forEach(day => {
          dailyCounts[day] = 0;
        });
        
        dailyData.forEach(email => {
          const day = email.created_at.split('T')[0];
          if (dailyCounts[day] !== undefined) {
            dailyCounts[day]++;
          }
        });
        
        const usageByDay = last7Days.map(day => ({
          date: day,
          count: dailyCounts[day]
        }));
        
        // Get tone distribution
        const { data: toneData, error: toneError } = await supabase
          .from('email_history')
          .select('tone_requested')
          .eq('user_id', user.id)
          .not('tone_requested', 'is', null);
          
        if (toneError) throw toneError;
        
        // Process tone data
        const toneMap = {};
        toneData.forEach(email => {
          const tone = email.tone_requested || 'default';
          toneMap[tone] = (toneMap[tone] || 0) + 1;
        });
        
        const toneDistribution = Object.entries(toneMap).map(([tone, count]) => ({
          tone,
          count
        }));
        
        // Calculate response rate (edited responses / total responses)
        const { count: editedCount, error: editedError } = await supabase
          .from('email_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('was_edited', true);
          
        if (editedError) throw editedError;
        
        const responseRate = totalEmails > 0 ? (editedCount / totalEmails) * 100 : 0;
        
        // Update stats state
        setUserStats({
          totalEmails,
          emailsThisMonth,
          responseRate: responseRate.toFixed(1),
          remainingQuota,
          usageByDay,
          toneDistribution
        });
        
        setUserId(user.id);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Emails</h3>
          <p className="text-3xl font-bold">{userStats.totalEmails}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Emails This Month</h3>
          <p className="text-3xl font-bold">{userStats.emailsThisMonth}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Edit Rate</h3>
          <p className="text-3xl font-bold">{userStats.responseRate}%</p>
          <p className="text-sm text-gray-500">of responses were edited</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Remaining Quota</h3>
          <p className="text-3xl font-bold">{userStats.remainingQuota}</p>
          <p className="text-sm text-gray-500">
            of {userProfile?.monthly_responses_limit} responses
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Email Activity (Last 7 Days)</h3>
          <div className="h-64">
            <LineChart
              data={userStats.usageByDay}
              xKey="date"
              yKey="count"
              color="#4F46E5"
            />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Response Tone Distribution</h3>
          <div className="h-64">
            <PieChart
              data={userStats.toneDistribution}
              nameKey="tone"
              valueKey="count"
              colors={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
            />
          </div>
        </div>
      </div>
      
      {/* Recent Emails */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Recent Emails</h3>
        {recentEmails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edited
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEmails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {email.customer_email_subject || 'No Subject'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(email.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.was_edited 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {email.was_edited ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={`/emails/${email.id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent emails found.</p>
        )}
        
        <div className="mt-4 text-right">
          <a 
            href="/emails" 
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            View All Emails →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
