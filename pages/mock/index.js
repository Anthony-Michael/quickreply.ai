import React from 'react';
import Link from 'next/link';

// Mock Navigation component
const MockNavigation = () => (
  <nav className="bg-blue-700 text-white shadow-sm py-1">
    <div className="max-w-7xl mx-auto px-2">
      <div className="flex items-center justify-between h-6">
        <div className="flex items-center">
          <Link href="/mock" className="flex-shrink-0 font-bold text-xs">
            ReplyRocket.io
          </Link>
          <div className="hidden md:block">
            <div className="ml-2 flex items-center space-x-0.5">
              <Link
                href="/mock"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 bg-blue-600 text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/mock/compose"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Email Composer
              </Link>
              <Link
                href="/mock/subscription"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Subscription
              </Link>
              <Link
                href="/mock/profile"
                className="px-1.5 py-0.5 rounded-sm text-xs font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="ml-1 flex items-center">
            <span className="text-xs mr-1">
              test@example.com
              <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">MOCK</span>
            </span>
            <Link
              href="/mock"
              className="px-1.5 py-0.5 border border-transparent text-xs font-medium rounded-sm
                      text-white bg-blue-600 hover:bg-blue-500 transition-colors duration-150"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

// Mock Dashboard page
export default function MockDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* This wrapper div prevents the global Navigation from _app.js from being displayed */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MockNavigation />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <h2 className="font-bold text-lg">Mock Mode</h2>
          <p>This is a static mock of the dashboard for testing purposes. No authentication or API calls are being made.</p>
          <p className="mt-2">
            View other pages:
            <Link href="/mock/compose" className="text-blue-600 hover:underline ml-2">Email Composer</Link>
            <Link href="/mock/subscription" className="text-blue-600 hover:underline ml-2">Subscription</Link>
            <Link href="/mock/profile" className="text-blue-600 hover:underline ml-2">Profile</Link>
          </p>
        </div>

        <h1 className="text-xl font-bold mb-3">Dashboard</h1>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium">Total Emails</h3>
            <p className="text-lg font-bold">47</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium">Emails This Month</h3>
            <p className="text-lg font-bold">12</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium">Edit Rate</h3>
            <p className="text-lg font-bold">0%</p>
            <p className="text-xs text-gray-500">of responses were edited</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-xs font-medium">Remaining Quota</h3>
            <p className="text-lg font-bold">13</p>
            <p className="text-xs text-gray-500">of responses</p>
          </div>
        </div>

        {/* Email Activity Chart */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-medium mb-4">Email Activity (Last 7 Days)</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
            <div className="text-gray-400">Chart Visualization (Static Mock)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Activity */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-medium mb-4">Monthly Activity</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
              <div className="text-gray-400">Chart Visualization (Static Mock)</div>
            </div>
          </div>

          {/* Response Tone Distribution */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-gray-700 font-medium mb-4">Response Tone Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
              <div className="text-gray-400">Chart Visualization (Static Mock)</div>
            </div>
          </div>
        </div>

        {/* Recent Emails */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-700 font-medium mb-4">Recent Emails</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edited</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array(5).fill().map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mock Email {i+1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-03-{10-i}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <Link href="/mock" className="hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-sm text-blue-600">
            <Link href="/mock" className="hover:underline">View All Emails →</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 