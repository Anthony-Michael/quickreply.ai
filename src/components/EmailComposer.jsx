import React, { useState, useEffect } from 'react';
import { generateEmailResponse } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const EmailComposer = () => {
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageLimitInfo, setUsageLimitInfo] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [responseHistory, setResponseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch response history on component mount
  useEffect(() => {
    fetchResponseHistory();
  }, []);

  // Function to fetch the user's last 5 email responses
  const fetchResponseHistory = async () => {
    try {
      setLoadingHistory(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('User not authenticated, cannot fetch response history');
        return;
      }
      
      const { data, error } = await supabase
        .from('email_history')
        .select('id, created_at, customer_email, generated_response, tone_requested')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching response history:', error);
        return;
      }
      
      setResponseHistory(data || []);
    } catch (err) {
      console.error('Error loading response history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Function to format a date string
  const formatDate = (dateString) => {
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to load a previous response
  const loadPreviousResponse = (email, response) => {
    setCustomerEmail(email);
    setGeneratedResponse(response);
    setEditedResponse(response);
    
    // Scroll to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!customerEmail.trim()) {
      setError('Please paste a customer email to generate a response');
      return;
    }

    setLoading(true);
    setError('');
    setShowUpgradeModal(false);

    try {
      const result = await generateEmailResponse(customerEmail, businessContext, tone);
      
      // Handle the enhanced response object
      const { response, businessName: responseBusiness } = result;
      
      setGeneratedResponse(response);
      setEditedResponse(response);
      setBusinessName(responseBusiness);
      setSuccessMessage(`Response generated successfully for ${responseBusiness}!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the response history to include the new response
      fetchResponseHistory();
    } catch (err) {
      console.error('Generation error:', err);
      
      // Check if this is a subscription limit error
      if (err.errorCode === 'SUBSCRIPTION_LIMIT_REACHED') {
        setUsageLimitInfo({
          currentUsage: err.currentUsage,
          limit: err.limit,
          tier: err.tier
        });
        setShowUpgradeModal(true);
      } else {
        setError(err.message || 'Failed to generate response. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editedResponse.trim()) {
      setError('No response to save as template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const templateName = prompt('Enter a name for this template:');

      if (!templateName) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('email_templates').insert({
        user_id: user.id,
        template_name: templateName,
        template_content: editedResponse,
        category: 'custom',
        tone: tone,
      });

      if (error) throw error;

      setSuccessMessage('Template saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedResponse);
    setSuccessMessage(`Response for ${businessName || 'your business'} copied to clipboard!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Add the upgrade modal component
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Subscription Limit Reached</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                You've used {usageLimitInfo?.currentUsage || 0} of your {usageLimitInfo?.limit || 0} monthly email responses.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h4 className="font-medium text-gray-900 text-sm mb-2">Current Plan: {usageLimitInfo?.tier || 'Free'}</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, ((usageLimitInfo?.currentUsage || 0) / (usageLimitInfo?.limit || 1)) * 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Upgrade your plan to generate more email responses.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link 
              to="/subscription-management" 
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Upgrade Options
            </Link>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Generate Email Response
        {businessName && <span className="text-blue-600 ml-2">for {businessName}</span>}
      </h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="customerEmail" className="block mb-2 font-medium">
          Customer Email
        </label>
        <textarea
          id="customerEmail"
          rows="8"
          className="w-full p-3 border border-gray-300 rounded-md"
          placeholder="Paste the customer email here..."
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        ></textarea>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="businessContext" className="block mb-2 font-medium">
            Business Context (Optional)
          </label>
          <textarea
            id="businessContext"
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Add any relevant information about your business..."
            value={businessContext}
            onChange={(e) => setBusinessContext(e.target.value)}
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="tone" className="block mb-2 font-medium">
            Response Tone
          </label>
          <select
            id="tone"
            className="w-full p-3 border border-gray-300 rounded-md"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="empathetic">Empathetic</option>
            <option value="concise">Concise</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={loading || !customerEmail.trim()}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : 'Generate Email Response'}
        </button>
      </div>
      
      {generatedResponse && (
        <div className="mb-6">
          <label htmlFor="generatedResponse" className="block mb-2 font-medium">
            Generated Response {businessName && <span className="text-blue-600 ml-1">({businessName} Style)</span>}
          </label>
          <textarea
            id="generatedResponse"
            rows="8"
            className="w-full p-3 border border-gray-300 rounded-md"
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
          ></textarea>
          
          <div className="mt-4 flex space-x-4">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={handleSaveTemplate}
            >
              Save as Template
            </button>
            
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              onClick={handleCopyToClipboard}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
      
      {/* Response History Section */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">
          <div className="flex items-center justify-between">
            <span>Recent Responses</span>
            <button 
              onClick={fetchResponseHistory} 
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </h2>
        
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : responseHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No previous responses found. Generate your first response above!
          </div>
        ) : (
          <div className="space-y-4">
            {responseHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{formatDate(item.created_at)}</div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {item.tone_requested || 'professional'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Customer email:</span> {truncateText(item.customer_email, 120)}
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  <span className="font-medium">Response:</span> {truncateText(item.generated_response, 160)}
                </div>
                <button 
                  onClick={() => loadPreviousResponse(item.customer_email, item.generated_response)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Load this response
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Render the upgrade modal */}
      <UpgradeModal />
    </div>
  );
};

export default EmailComposer;
