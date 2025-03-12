import React, { useState, useEffect, useRef } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { generateEmailResponse } from '../lib/openai';
import Link from 'next/link';
import useEmailResponse from '../hooks/useEmailResponse';

// New component for the email input form
const EmailForm = ({ customerEmail, setCustomerEmail, businessContext, setBusinessContext, tone, setTone, autoGenerate, setAutoGenerate, handleGenerate }) => {
  return (
    <div>
      {/* Email input */}
      <div className="mb-4">
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
          Customer Email
        </label>
        <textarea
          id="customerEmail"
          name="customerEmail"
          rows={5}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
      </div>

      {/* Business context input */}
      <div className="mb-4">
        <label htmlFor="businessContext" className="block text-sm font-medium text-gray-700">
          Business Context
        </label>
        <textarea
          id="businessContext"
          name="businessContext"
          rows={3}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={businessContext}
          onChange={(e) => setBusinessContext(e.target.value)}
        />
      </div>

      {/* Tone selector */}
      <div className="mb-4">
        <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
          Tone
        </label>
        <select
          id="tone"
          name="tone"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="empathetic">Empathetic</option>
          <option value="humorous">Humorous</option>
        </select>
      </div>

      {/* Auto-generate toggle */}
      <div className="flex items-center mb-4">
        <input
          id="autoGenerate"
          name="autoGenerate"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={autoGenerate}
          onChange={(e) => setAutoGenerate(e.target.checked)}
        />
        <label htmlFor="autoGenerate" className="ml-2 block text-sm text-gray-900">
          Auto-generate response
        </label>
      </div>

      {/* Generate button */}
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={handleGenerate}
      >
        Generate Response
      </button>
    </div>
  );
};

// New component for displaying the generated response
const ResponseViewer = ({ generatedResponse, editedResponse, setEditedResponse, responseTextareaRef, handleSave }) => {
  return (
    <div>
      {/* Generated response */}
      <div className="mb-4">
        <label htmlFor="generatedResponse" className="block text-sm font-medium text-gray-700">
          Generated Response
        </label>
        <div className="mt-1 p-3 bg-gray-100 rounded-md">
          <p>{generatedResponse}</p>
        </div>
      </div>

      {/* Editable response */}
      <div className="mb-4">
        <label htmlFor="editedResponse" className="block text-sm font-medium text-gray-700">
          Edit Response
        </label>
        <textarea
          id="editedResponse"
          name="editedResponse"
          rows={8}
          ref={responseTextareaRef}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={editedResponse}
          onChange={(e) => setEditedResponse(e.target.value)}
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        onClick={handleSave}
      >
        Save Response
      </button>
    </div>
  );
};

// New component for the onboarding tutorial
const OnboardingTutorial = ({ showOnboarding, onboardingStep, nextOnboardingStep, prevOnboardingStep, skipOnboarding, emailInputRef, generateBtnRef, advancedOptionsRef, responseAreaRef, shortcutsRef }) => {
  if (!showOnboarding) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Onboarding content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                Welcome to ReplyRocket!
              </h3>
              <div className="mt-2">
                {onboardingStep === 0 && (
                  <p className="text-sm text-gray-500">
                    Let's take a quick tour of the email composer. First, paste a customer email into the input area.
                  </p>
                )}
                {onboardingStep === 1 && (
                  <p className="text-sm text-gray-500">
                    Great! Now click the "Generate Response" button to create a reply.
                  </p>
                )}
                {onboardingStep === 2 && (
                  <p className="text-sm text-gray-500">
                    You can customize the business context, tone, and other settings in the Advanced Options.
                  </p>
                )}
                {onboardingStep === 3 && (
                  <p className="text-sm text-gray-500">
                    The generated response will appear here. You can edit it before saving.
                  </p>
                )}
                {onboardingStep === 4 && (
                  <p className="text-sm text-gray-500">
                    Helpful shortcuts will be displayed in this area. That's it for the tour!
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              onClick={nextOnboardingStep}
            >
              {onboardingStep < 4 ? 'Next' : 'Finish'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={prevOnboardingStep}
              disabled={onboardingStep === 0}
            >
              Previous
            </button>
          </div>
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-600 underline"
              onClick={skipOnboarding}
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailComposer = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageLimitInfo, setUsageLimitInfo] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [responseHistory, setResponseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [devMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  // Auto-generate flag
  const [autoGenerate, setAutoGenerate] = useState(false);
  // Reference to the response textarea
  const responseTextareaRef = useRef(null);
  
  // Onboarding refs
  const emailInputRef = useRef(null);
  const generateBtnRef = useRef(null);
  const advancedOptionsRef = useRef(null);
  const responseAreaRef = useRef(null);
  const shortcutsRef = useRef(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const {
    customerEmail,
    setCustomerEmail,
    businessContext,
    setBusinessContext,
    tone,
    setTone,
    generatedResponse,
    isGenerating,
    error,
    generateResponse,
  } = useEmailResponse();

  // Fetch response history on component mount
  useEffect(() => {
    if (user || devMode) {
      fetchResponseHistory();
    }
  }, [user, devMode]);
  
  // Check if user has completed onboarding
  useEffect(() => {
    if (user || devMode) {
      // Check local storage first (for faster UX)
      const hasCompletedOnboarding = localStorage.getItem('replyrocket_onboarding_complete');
      
      if (hasCompletedOnboarding === 'true') {
        setOnboardingComplete(true);
        return;
      }
      
      // If not in localStorage, check database for first-time users
      const checkOnboardingStatus = async () => {
        try {
          if (devMode) {
            // In dev mode, show onboarding by default unless explicitly skipped
            const devSkipOnboarding = localStorage.getItem('dev_skip_onboarding');
            if (devSkipOnboarding !== 'true') {
              setShowOnboarding(true);
            }
            return;
          }
          
          // In production, check the user's profile for onboarding status
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error checking onboarding status:', error);
            return;
          }
          
          if (!data || data.onboarding_completed !== true) {
            setShowOnboarding(true);
          } else {
            setOnboardingComplete(true);
            localStorage.setItem('replyrocket_onboarding_complete', 'true');
          }
        } catch (err) {
          console.error('Error checking onboarding status:', err);
        }
      };
      
      checkOnboardingStatus();
    }
  }, [user, devMode, supabase]);

  // Auto-generate response when customerEmail content changes and autoGenerate is enabled
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (autoGenerate && customerEmail.trim() && !loading) {
        handleGenerate();
      }
    }, 800); // 800ms debounce delay

    return () => clearTimeout(delayDebounce);
  }, [customerEmail, autoGenerate]);

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
    
    // Scroll to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to handle next onboarding step
  const nextOnboardingStep = () => {
    if (onboardingStep < 5) {
      setOnboardingStep(prevStep => prevStep + 1);
    } else {
      completeOnboarding();
    }
  };
  
  // Function to handle previous onboarding step
  const prevOnboardingStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(prevStep => prevStep - 1);
    }
  };
  
  // Function to skip onboarding
  const skipOnboarding = () => {
    completeOnboarding();
  };
  
  // Function to mark onboarding as complete
  const completeOnboarding = async () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);
    localStorage.setItem('replyrocket_onboarding_complete', 'true');
    
    if (devMode) {
      localStorage.setItem('dev_skip_onboarding', 'true');
      return;
    }
    
    try {
      // Update the user's profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating onboarding status:', error);
      }
    } catch (err) {
      console.error('Error updating onboarding status:', err);
    }
  };

  const handleGenerate = async () => {
    if (!customerEmail.trim()) {
      setError('Please paste a customer email in the text area above to generate a response.');
      return;
    }

    if (!user && !devMode) {
      setError('You need to be logged in to generate responses. Please log in or create an account to continue.');
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
          setError('Your session has expired. Please log in again to continue generating responses.');
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
      setBusinessName(responseBusiness);
      setSuccessMessage(`Response generated successfully for ${responseBusiness}!`);

      // Auto-focus the response textarea for quick editing
      if (responseTextareaRef.current) {
        responseTextareaRef.current.focus();
      }

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
      } else if (err.errorCode === 'API_RATE_LIMIT') {
        setError('AI service is currently experiencing high demand. Please try again in a few minutes.');
      } else if (err.errorCode === 'CONTENT_POLICY_VIOLATION') {
        setError('Your request contains content that violates our usage policies. Please revise your email content and try again.');
      } else if (err.errorCode === 'AUTH_ERROR') {
        setError('Authentication error. Please log out and log back in to refresh your session.');
      } else if (err.errorCode === 'NETWORK_ERROR') {
        setError('Network connection issue detected. Please check your internet connection and try again.');
      } else if (err.errorCode === 'SERVER_ERROR') {
        setError('Our servers are experiencing technical difficulties. Our team has been notified and is working on a fix. Please try again later.');
      } else {
        setError('We couldn\'t generate a response at this time. Please try again or contact support if the issue persists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedResponse) {
      setError('There\'s no response to copy. Please generate a response first.');
      return;
    }
    
    navigator.clipboard.writeText(generatedResponse)
      .then(() => {
        setSuccessMessage('Response copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Unable to copy to clipboard. Try selecting the text manually and using Ctrl+C or Cmd+C to copy.');
      });
  };

  const handleSaveTemplate = async () => {
    if (!generatedResponse.trim()) {
      setError('There\'s no response to save as a template. Please generate a response first.');
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
        template_content: generatedResponse,
        category: 'custom',
        tone: tone,
      });

      if (error) {
        if (error.code === '23505') {
          throw { message: 'A template with this name already exists. Please use a different name.' };
        } else if (error.code === '23503') {
          throw { message: 'User authentication issue. Please log out and log back in, then try again.' };
        } else if (error.code.startsWith('22')) {
          throw { message: 'Invalid template data. Please check your response and try again.' };
        } else {
          throw { message: 'Database error. Please try again or contact support if the issue persists.' };
        }
      }

      setSuccessMessage('Template saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save template. Please try again later or contact support if the issue persists.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle keyboard shortcuts
  const handleKeyboardShortcut = (e) => {
    // Ctrl/Cmd + Enter to generate response
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleGenerate();
    }
    
    // Ctrl/Cmd + Shift + C to copy response
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c' && generatedResponse) {
      e.preventDefault();
      handleCopyToClipboard();
    }
  };

  // Upgrade modal component
  const UpgradeModal = () => {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Monthly Response Limit Reached</h3>
            <p className="mt-1 text-sm text-gray-500">
              You've used all {usageLimitInfo?.limit} email responses included in your {usageLimitInfo?.tier} plan this month. Upgrade now to continue generating responses without interruption.
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
  
  // Onboarding tooltip component
  const OnboardingTooltip = ({ step, targetRef, position = 'bottom', children, onNext, onPrev, onSkip, currentStep, totalSteps }) => {
    if (!targetRef.current) return null;
    
    // Get position of the target element
    const targetRect = targetRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Base styles
    let tooltipStyle = {
      position: 'absolute',
      zIndex: 50,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '1rem',
      maxWidth: '18rem',
      border: '1px solid #e5e7eb'
    };
    
    // Set position based on parameter
    switch(position) {
      case 'top':
        tooltipStyle = {
          ...tooltipStyle,
          bottom: `${windowHeight - targetRect.top + 10}px`,
          left: `${targetRect.left + targetRect.width / 2 - 150}px`,
        };
        break;
      case 'right':
        tooltipStyle = {
          ...tooltipStyle,
          left: `${targetRect.right + 10}px`,
          top: `${targetRect.top + targetRect.height / 2 - 70}px`,
        };
        break;
      case 'left':
        tooltipStyle = {
          ...tooltipStyle,
          right: `${windowWidth - targetRect.left + 10}px`,
          top: `${targetRect.top + targetRect.height / 2 - 70}px`,
        };
        break;
      case 'bottom':
      default:
        tooltipStyle = {
          ...tooltipStyle,
          top: `${targetRect.bottom + 10}px`,
          left: `${targetRect.left + targetRect.width / 2 - 150}px`,
        };
    }
    
    // Create a highlight effect on the target
    if (targetRef.current) {
      targetRef.current.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    }
    
    // Clean up highlight on unmount
    useEffect(() => {
      return () => {
        if (targetRef.current) {
          targetRef.current.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }
      };
    }, [step]);
    
    return (
      <div style={tooltipStyle} className="onboarding-tooltip">
        <div className="text-sm text-gray-800">
          {children}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <button 
                onClick={onPrev}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            )}
            <button 
              onClick={onSkip}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Skip Tour
            </button>
            <button 
              onClick={onNext}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {currentStep === totalSteps ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Onboarding overlay - darkens the rest of the UI
  const OnboardingOverlay = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 z-30"
      onClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Onboarding overlay */}
      {showOnboarding && <OnboardingOverlay />}
    
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold" ref={shortcutsRef}>
          Generate Email Response {businessName && `for ${businessName}`}
        </h1>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <input
              id="autoGenerate"
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={autoGenerate}
              onChange={() => setAutoGenerate(!autoGenerate)}
            />
            <label htmlFor="autoGenerate" className="ml-2 text-sm text-gray-700">
              Auto-generate
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Ctrl+Enter to generate
          </div>
        </div>
        
        {/* Step 1: Welcome tooltip */}
        {showOnboarding && onboardingStep === 0 && (
          <OnboardingTooltip
            step={0}
            targetRef={shortcutsRef}
            position="bottom"
            onNext={nextOnboardingStep}
            onPrev={prevOnboardingStep}
            onSkip={skipOnboarding}
            currentStep={1}
            totalSteps={6}
          >
            <h3 className="font-bold text-base mb-2">Welcome to ReplyRocket.io! 🚀</h3>
            <p>This quick tour will show you how to generate AI-powered email responses in just a few seconds.</p>
          </OnboardingTooltip>
        )}
      </div>

      {/* Main content - split into two panels for desktop */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left panel - inputs */}
        <div className="w-full md:w-1/2">
          {/* Customer email input */}
          <div className="mb-4">
            <label htmlFor="customerEmail" className="block mb-2 text-sm font-medium text-gray-700">
              Customer Email
            </label>
            <textarea
              id="customerEmail"
              ref={emailInputRef}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="8"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              onKeyDown={handleKeyboardShortcut}
              placeholder="Paste the customer's email here..."
              autoFocus
            ></textarea>
          </div>
          
          {/* Step 2: Email input tooltip */}
          {showOnboarding && onboardingStep === 1 && (
            <OnboardingTooltip
              step={1}
              targetRef={emailInputRef}
              position="bottom"
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
              onSkip={skipOnboarding}
              currentStep={2}
              totalSteps={6}
            >
              <h3 className="font-bold text-base mb-2">Start Here</h3>
              <p>Paste your customer's email here. The AI will analyze it and generate a professional response.</p>
            </OnboardingTooltip>
          )}

          {/* Options panel - collapsible */}
          <details className="mb-4 rounded-lg border p-2" ref={advancedOptionsRef}>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Advanced Options
            </summary>
            <div className="mt-3">
              {/* Business context input */}
              <div className="mb-3">
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
              <div className="mb-3">
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
            </div>
          </details>
          
          {/* Step 3: Advanced options tooltip */}
          {showOnboarding && onboardingStep === 2 && (
            <OnboardingTooltip
              step={2}
              targetRef={advancedOptionsRef}
              position="bottom"
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
              onSkip={skipOnboarding}
              currentStep={3}
              totalSteps={6}
            >
              <h3 className="font-bold text-base mb-2">Customize Your Response</h3>
              <p>Click here to add business context and choose the tone of your response (professional, friendly, formal, etc).</p>
            </OnboardingTooltip>
          )}

          {/* Generate button */}
          <button
            ref={generateBtnRef}
            onClick={handleGenerate}
            disabled={loading || !customerEmail.trim()}
            className="w-full mb-4 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
          
          {/* Upgrade button - only show for free or trial users */}
          {(user?.subscription_tier === 'free' || user?.subscription_tier === 'trial') && (
            <Link 
              href="/subscription" 
              className="w-full mb-4 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Upgrade to Pro — Get More Responses
            </Link>
          )}
          
          {/* Step 4: Generate button tooltip */}
          {showOnboarding && onboardingStep === 3 && (
            <OnboardingTooltip
              step={3}
              targetRef={generateBtnRef}
              position="bottom"
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
              onSkip={skipOnboarding}
              currentStep={4}
              totalSteps={6}
            >
              <h3 className="font-bold text-base mb-2">Generate Response</h3>
              <p>Click this button to generate your AI response. You can also press Ctrl+Enter from the email input field.</p>
            </OnboardingTooltip>
          )}
        </div>

        {/* Right panel - response */}
        <div className="w-full md:w-1/2">
          {/* Display generated response */}
          <div 
            ref={responseAreaRef}
            className={`h-full ${!generatedResponse ? 'flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50' : ''}`}
          >
            {generatedResponse ? (
              <>
                <div className="mb-2 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Generated Response {businessName && `(${businessName} Style)`}
                  </h2>
                  <div className="text-xs text-gray-500">
                    Ctrl+Shift+C to copy
                  </div>
                </div>
                <textarea
                  ref={responseTextareaRef}
                  className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="12"
                  value={generatedResponse}
                  onChange={(e) => setGeneratedResponse(e.target.value)}
                  onKeyDown={handleKeyboardShortcut}
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
              </>
            ) : (
              <div className="text-center text-gray-500">
                Your generated response will appear here
              </div>
            )}
          </div>
          
          {/* Step 5: Response area tooltip */}
          {showOnboarding && onboardingStep === 4 && (
            <OnboardingTooltip
              step={4}
              targetRef={responseAreaRef}
              position="left"
              onNext={nextOnboardingStep}
              onPrev={prevOnboardingStep}
              onSkip={skipOnboarding}
              currentStep={5}
              totalSteps={6}
            >
              <h3 className="font-bold text-base mb-2">Your AI Response</h3>
              <p>Your generated response will appear here. You can edit it before copying or saving as a template.</p>
            </OnboardingTooltip>
          )}
        </div>
      </div>

      {/* Recent Responses */}
      <div className="mt-8 border-t pt-4">
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
        
        {/* Step 6: Subscription and usage tooltip */}
        {showOnboarding && onboardingStep === 5 && (
          <OnboardingTooltip
            step={5}
            targetRef={{current: document.querySelector('.max-w-4xl')}}
            position="top"
            onNext={nextOnboardingStep}
            onPrev={prevOnboardingStep}
            onSkip={skipOnboarding}
            currentStep={6}
            totalSteps={6}
          >
            <h3 className="font-bold text-base mb-2">Usage & Subscription</h3>
            <p>Your free plan includes 25 responses per month. Need more? Click on your profile menu and select "Subscription" to upgrade your plan.</p>
          </OnboardingTooltip>
        )}

        {loadingHistory ? (
          <div className="text-center py-4">
            <svg className="animate-spin h-6 w-6 mx-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : responseHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responseHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
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
                  Load This Response
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No recent responses found. Generate your first response above!
          </div>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && <UpgradeModal />}
    </div>
  );
};

export default EmailComposer;
