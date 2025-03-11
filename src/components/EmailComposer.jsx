import React, { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { generateEmailResponse } from '../lib/openai';
import Link from 'next/link';

const EmailComposer = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
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
  const [devMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');

  // Fetch response history on component mount
  useEffect(() => {
    if (user || devMode) {
      fetchResponseHistory();
    }
  }, [user, devMode]);

  // Function to fetch the user's last 5 email responses
  const fetchResponseHistory = async () => {
    if (!user && !devMode) {
      console.warn('User not authenticated, cannot fetch response history');
      return;
    }
    
    try {
      setLoadingHistory(true);
      
      // Use mock data in development mode
      if (devMode) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Return mock history data
        setResponseHistory([
          {
            id: 'mock-1',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email: 'I recently purchased your product and have some questions about the features. Can you help?',
            generated_response: 'Thank you for your recent purchase! I\'d be happy to answer any questions you have about our product features.',
            tone_requested: 'friendly'
          },
          {
            id: 'mock-2',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email: 'I would like to request a refund for my recent order #12345.',
            generated_response: 'I understand you would like a refund for order #12345. We can process this request immediately for you.',
            tone_requested: 'professional'
          },
          {
            id: 'mock-3',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email: 'Your product arrived damaged. I expect immediate resolution.',
            generated_response: 'We sincerely apologize that your product arrived damaged. We take this matter very seriously and will resolve this immediately.',
            tone_requested: 'empathetic'
          }
        ]);
        return;
      }
      
      // Otherwise try to fetch real data
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

    if (!user && !devMode) {
      setError('You must be logged in to generate responses');
      return;
    }

    setLoading(true);
    setError('');
    setShowUpgradeModal(false);

    try {
      let token = 'dev-mode-token';

      // Get real token if not in dev mode
      if (!devMode) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        token = session.access_token;
      }

      const result = await generateEmailResponse(
        customerEmail, 
        businessContext, 
        tone, 
        token
      );
      
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
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Limit Reached</h3>
            <p className="mt-1 text-sm text-gray-500">
              You've reached your monthly limit of {usageLimitInfo?.limit} email responses on your {usageLimitInfo?.tier} plan.
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usage this month</span>
              <span className="text-sm font-medium text-gray-900">
                {usageLimitInfo?.currentUsage} / {usageLimitInfo?.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (usageLimitInfo?.currentUsage / usageLimitInfo?.limit) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Link 
              href="/subscription" 
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Upgrade Options
            </Link>
            <button
              type="button"
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
    <div className="max-w-4xl mx-auto p-4">
      {/* Display error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Display success message */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Email composer form */}
      <h1 className="text-xl font-bold mb-4">
        Generate Email Response {businessName && `for ${businessName}`}
      </h1>

      {/* Customer email input */}
      <div className="mb-4">
        <label htmlFor="customerEmail" className="block mb-2 text-sm font-medium text-gray-700">
          Customer Email
        </label>
        <textarea
          id="customerEmail"
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="6"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Paste the customer's email here..."
        ></textarea>
      </div>

      {/* Business context input */}
      <div className="mb-4">
        <label htmlFor="businessContext" className="block mb-2 text-sm font-medium text-gray-700">
          Business Context (Optional)
        </label>
        <textarea
          id="businessContext"
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          value={businessContext}
          onChange={(e) => setBusinessContext(e.target.value)}
          placeholder="Add any relevant information about your business..."
        ></textarea>
      </div>

      {/* Tone selection */}
      <div className="mb-4">
        <label htmlFor="tone" className="block mb-2 text-sm font-medium text-gray-700">
          Response Tone
        </label>
        <select
          id="tone"
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !customerEmail.trim()}
        className="w-full mb-6 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Email Response'
        )}
      </button>

      {/* Display generated response */}
      {generatedResponse && (
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">
            Generated Response {businessName && `(${businessName} Style)`}
          </h2>
          <textarea
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
            rows="8"
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
          ></textarea>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={handleSaveTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save as Template
            </button>
          </div>
        </div>
      )}

      {/* Recent Responses */}
      <div className="mt-10 border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Responses</h2>
          <button
            onClick={fetchResponseHistory}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            disabled={loadingHistory}
          >
            {loadingHistory ? (
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {loadingHistory ? (
          <div className="text-center py-4">
            <svg className="animate-spin h-6 w-6 mx-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : responseHistory.length > 0 ? (
          <div className="space-y-4">
            {responseHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(item.created_at)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {item.tone_requested || 'professional'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{truncateText(item.customer_email, 150)}</p>
                <p className="text-sm text-gray-800 mb-3">{truncateText(item.generated_response, 200)}</p>
                <button
                  onClick={() => loadPreviousResponse(item.customer_email, item.generated_response)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Load this response
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">No previous responses found. Generate your first response above!</p>
        )}
      </div>

      {/* Subscription limit modal */}
      {showUpgradeModal && <UpgradeModal />}
    </div>
  );
};

export default EmailComposer;
