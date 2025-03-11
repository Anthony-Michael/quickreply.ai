import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProfileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    business_name: '',
    business_description: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      setLoading(true);

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Get the user's profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        email: data.email || '',
        business_name: data.business_name || '',
        business_description: data.business_description || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: profile.business_name,
          business_description: profile.business_description,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading profile data...</div>
        </div>
      ) : (
        <form onSubmit={updateProfile} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              disabled
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100"
            />
            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
          </div>

          <div className="mb-4">
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={profile.business_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your business name"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="business_description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Business Description
            </label>
            <textarea
              id="business_description"
              name="business_description"
              rows={4}
              value={profile.business_description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your business (this helps create better email responses)"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <div className="text-sm text-gray-500">
              Subscription Tier:{' '}
              <span className="font-medium">{profile.subscription_tier || 'Free'}</span>
            </div>
          </div>
        </form>
      )}

      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Subscription Information</h2>
        <p className="mb-2">
          Visit the{' '}
          <a href="/subscription" className="text-blue-600 hover:text-blue-800">
            Subscription Management
          </a>{' '}
          page to update your subscription or view detailed usage information.
        </p>
      </div>
    </div>
  );
};

export default ProfileSettings;
