import React, { useState } from 'react';
import Link from 'next/link';

// Mock Navigation component
const MockNavigation = () => (
  <nav className="bg-blue-700 text-white shadow-sm py-2">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-8">
        <div className="flex items-center">
          <Link href="/mock" className="flex-shrink-0 font-bold text-sm">
            ReplyRocket.io
          </Link>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-2">
              <Link
                href="/mock"
                className="px-2 py-1 rounded-sm text-sm font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Dashboard
              </Link>
              <Link
                href="/mock/compose"
                className="px-2 py-1 rounded-sm text-sm font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Email Composer
              </Link>
              <Link
                href="/mock/subscription"
                className="px-2 py-1 rounded-sm text-sm font-medium transition-colors duration-150 text-white hover:bg-blue-600"
              >
                Subscription
              </Link>
              <Link
                href="/mock/profile"
                className="px-2 py-1 rounded-sm text-sm font-medium transition-colors duration-150 bg-blue-600 text-white"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="ml-4 flex items-center">
            <span className="text-sm mr-2">
              test@example.com
              <span className="bg-yellow-400 text-xs text-black px-1 ml-1 rounded">MOCK</span>
            </span>
            <Link
              href="/mock"
              className="px-2 py-1 border border-transparent text-sm font-medium rounded-sm
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

// Mock Profile Page
export default function MockProfile() {
  const [businessName, setBusinessName] = useState('TechSolutions Inc.');
  const [businessDescription, setBusinessDescription] = useState('We provide IT consulting and managed services for small to medium-sized businesses. Our focus is on cloud solutions, cybersecurity, and responsive technical support.');
  const [preferredTone, setPreferredTone] = useState('professional');
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = () => {
    setSaveStatus('Changes saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* This wrapper div prevents the global Navigation from _app.js from being displayed */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MockNavigation />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <h2 className="font-bold text-lg mb-1">Mock Mode</h2>
          <p className="mb-2">This is a static mock of the Profile page for testing purposes. No authentication or API calls are being made.</p>
          <div className="flex flex-wrap gap-2">
            <span>View other pages:</span>
            <Link href="/mock" className="text-blue-600 hover:underline">Dashboard</Link>
            <Link href="/mock/compose" className="text-blue-600 hover:underline">Email Composer</Link>
            <Link href="/mock/subscription" className="text-blue-600 hover:underline">Subscription</Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Profile Settings</h3>
              <p className="text-sm text-gray-500 mb-4">
                Update your profile information and preferences.
              </p>
              
              {saveStatus && (
                <div className="mb-6 p-3 bg-green-50 text-green-700 rounded border border-green-200">
                  {saveStatus}
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="email"
                      id="email"
                      disabled
                      className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300 bg-gray-100"
                      value="test@example.com"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support for email updates.</p>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <div>
                    <input
                      type="text"
                      name="business-name"
                      id="business-name"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Your business name will be used to customize AI responses.</p>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="business-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description
                  </label>
                  <div>
                    <textarea
                      id="business-description"
                      name="business-description"
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe your business, products, services, and customer base..."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">This description helps our AI understand your business context when generating responses.</p>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="preferred-tone" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Response Tone
                  </label>
                  <div>
                    <select
                      id="preferred-tone"
                      name="preferred-tone"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={preferredTone}
                      onChange={(e) => setPreferredTone(e.target.value)}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="empathetic">Empathetic</option>
                      <option value="concise">Concise</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">This will be the default tone for your email responses.</p>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Account Security</h3>
              <div className="max-w-xl text-sm text-gray-500 mb-4">
                <p>Manage your account password and security settings.</p>
              </div>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => alert('Password change functionality would appear here')}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Danger Zone</h3>
              <div className="max-w-xl text-sm text-gray-500 mb-4">
                <p>Once you delete your account, all of your data will be permanently deleted.</p>
              </div>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => alert('This is a mock interface. Account deletion is not available.')}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 