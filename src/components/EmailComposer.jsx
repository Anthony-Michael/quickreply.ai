import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
// import { generateEmailResponse } from '../lib/openai'; // Commented out as it's unused
// import Link from 'next/link'; // Commented out as it's unused
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { useEmailResponse } from '../hooks/useEmailResponse';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// New component for the email input form
const EmailForm = ({
  customerEmail,
  setCustomerEmail,
  businessContext,
  setBusinessContext,
  tone,
  setTone,
  autoGenerate,
  setAutoGenerate,
  handleGenerate,
  isGenerating,
}) => {
  return (
    <div role='form' aria-labelledby='email-form-title'>
      <h2 id='email-form-title' className='sr-only'>
        Email Response Generator
      </h2>
      {/* Email input */}
      <div className='mb-4'>
        <label htmlFor='customerEmail' className='block text-sm font-medium text-gray-700'>
          Customer Email{' '}
          <span className='text-red-500' aria-hidden='true'>
            *
          </span>
          <span className='sr-only'>(required)</span>
        </label>
        <textarea
          id='customerEmail'
          name='customerEmail'
          rows={5}
          className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          aria-required='true'
          aria-describedby='customerEmail-desc'
        />
        <div id='customerEmail-desc' className='mt-1 text-sm text-gray-500'>
          Paste the customer&apos;s email that you want to respond to
        </div>
      </div>

      {/* Business context input */}
      <div className='mb-4'>
        <label htmlFor='businessContext' className='block text-sm font-medium text-gray-700'>
          Business Context
        </label>
        <textarea
          id='businessContext'
          name='businessContext'
          rows={3}
          className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
          value={businessContext}
          onChange={(e) => setBusinessContext(e.target.value)}
          aria-describedby='businessContext-desc'
        />
        <div id='businessContext-desc' className='mt-1 text-sm text-gray-500'>
          Additional context about your business or the specific situation
        </div>
      </div>

      {/* Tone selector */}
      <div className='mb-4'>
        <label htmlFor='tone' className='block text-sm font-medium text-gray-700'>
          Tone
        </label>
        <select
          id='tone'
          name='tone'
          className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          aria-describedby='tone-desc'
        >
          <option value='professional'>Professional</option>
          <option value='friendly'>Friendly</option>
          <option value='empathetic'>Empathetic</option>
          <option value='humorous'>Humorous</option>
        </select>
        <div id='tone-desc' className='mt-1 text-sm text-gray-500'>
          Select the tone for your response
        </div>
      </div>

      {/* Auto-generate toggle */}
      <div className='flex items-center mb-4'>
        <input
          id='autoGenerate'
          name='autoGenerate'
          type='checkbox'
          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          checked={autoGenerate}
          onChange={(e) => setAutoGenerate(e.target.checked)}
          aria-describedby='autoGenerate-desc'
        />
        <label htmlFor='autoGenerate' className='ml-2 block text-sm text-gray-900'>
          Auto-generate response
        </label>
        <div id='autoGenerate-desc' className='sr-only'>
          When enabled, responses will be generated automatically as you type
        </div>
      </div>

      {/* Generate button */}
      <button
        type='button'
        className='inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        onClick={handleGenerate}
        disabled={isGenerating}
        aria-busy={isGenerating}
      >
        {isGenerating ? (
          <>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Response'
        )}
      </button>
    </div>
  );
};

EmailForm.propTypes = {
  customerEmail: PropTypes.string.isRequired,
  setCustomerEmail: PropTypes.func.isRequired,
  businessContext: PropTypes.string.isRequired,
  setBusinessContext: PropTypes.func.isRequired,
  tone: PropTypes.string.isRequired,
  setTone: PropTypes.func.isRequired,
  autoGenerate: PropTypes.bool.isRequired,
  setAutoGenerate: PropTypes.func.isRequired,
  handleGenerate: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool.isRequired,
};

// New component for displaying the generated response
const ResponseViewer = ({
  generatedResponse,
  editedResponse,
  setEditedResponse,
  responseTextareaRef,
  handleSave,
  handleCopy,
  isLoading,
}) => {
  return (
    <div role='region' aria-label='Generated Response' className='mt-8'>
      {/* Generated response */}
      <div className='mb-4'>
        <label htmlFor='generatedResponse' className='block text-sm font-medium text-gray-700'>
          Generated Response
        </label>
        <div
          className='mt-1 p-3 bg-gray-100 rounded-md'
          id='generatedResponse'
          tabIndex='0'
          aria-readonly='true'
          role='textbox'
        >
          <p>{generatedResponse}</p>
        </div>
      </div>

      {/* Editable response */}
      <div className='mb-4'>
        <label htmlFor='editedResponse' className='block text-sm font-medium text-gray-700'>
          Edit Response
        </label>
        <textarea
          id='editedResponse'
          name='editedResponse'
          rows={8}
          ref={responseTextareaRef}
          className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
          value={editedResponse}
          onChange={(e) => setEditedResponse(e.target.value)}
          aria-describedby='editedResponse-desc'
        />
        <div id='editedResponse-desc' className='mt-1 text-sm text-gray-500'>
          You can edit the response before saving or copying
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex space-x-4'>
        {/* Save button */}
        <button
          type='button'
          className='inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          onClick={handleSave}
          disabled={isLoading}
        >
          Save Response
        </button>

        {/* Copy button */}
        <button
          type='button'
          className='inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          onClick={handleCopy}
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

ResponseViewer.propTypes = {
  generatedResponse: PropTypes.string.isRequired,
  editedResponse: PropTypes.string.isRequired,
  setEditedResponse: PropTypes.func.isRequired,
  responseTextareaRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]).isRequired,
  handleSave: PropTypes.func.isRequired,
  handleCopy: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

// New component for the onboarding tutorial
const OnboardingTutorial = ({
  showOnboarding,
  onboardingStep,
  nextOnboardingStep,
  prevOnboardingStep,
  skipOnboarding,
  emailInputRef,
  generateBtnRef,
  advancedOptionsRef,
  responseAreaRef,
  shortcutsRef,
}) => {
  if (!showOnboarding) return null;

  return (
    <div
      className='fixed z-10 inset-0 overflow-y-auto'
      role='dialog'
      aria-labelledby='tutorial-heading'
      aria-modal='true'
    >
      <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div className='fixed inset-0 transition-opacity' aria-hidden='true'>
          <div className='absolute inset-0 bg-gray-500 opacity-75'></div>
        </div>

        {/* Onboarding content */}
        <div
          className='inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6'
          role='document'
        >
          <div>
            <div className='mt-3 text-center sm:mt-5'>
              <h3 className='text-lg leading-6 font-medium text-gray-900' id='tutorial-heading'>
                Welcome to ReplyRocket!
              </h3>
              <div className='mt-2'>
                {onboardingStep === 0 && (
                  <p className='text-sm text-gray-500'>
                    Let&apos;s take a quick tour of the email composer. First, paste a customer
                    email into the input area.
                  </p>
                )}
                {onboardingStep === 1 && (
                  <p className='text-sm text-gray-500'>
                    Great! Now click the &quot;Generate Response&quot; button to create a reply.
                  </p>
                )}
                {onboardingStep === 2 && (
                  <p className='text-sm text-gray-500'>
                    You can customize the business context, tone, and other settings in the Advanced
                    Options.
                  </p>
                )}
                {onboardingStep === 3 && (
                  <p className='text-sm text-gray-500'>
                    The generated response will appear here. You can edit it before saving.
                  </p>
                )}
                {onboardingStep === 4 && (
                  <p className='text-sm text-gray-500'>
                    Helpful shortcuts will be displayed in this area. That&apos;s it for the tour!
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className='mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense'>
            <button
              type='button'
              className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm'
              onClick={nextOnboardingStep}
              aria-label={onboardingStep < 4 ? 'Next tutorial step' : 'Finish tutorial'}
            >
              {onboardingStep < 4 ? 'Next' : 'Finish'}
            </button>
            <button
              type='button'
              className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm'
              onClick={prevOnboardingStep}
              disabled={onboardingStep === 0}
              aria-label='Previous tutorial step'
            >
              Previous
            </button>
          </div>
          <div className='mt-6 text-center'>
            <button
              type='button'
              className='text-sm text-gray-500 hover:text-gray-600 underline'
              onClick={skipOnboarding}
              aria-label='Skip entire tutorial'
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

OnboardingTutorial.propTypes = {
  showOnboarding: PropTypes.bool.isRequired,
  onboardingStep: PropTypes.number.isRequired,
  nextOnboardingStep: PropTypes.func.isRequired,
  prevOnboardingStep: PropTypes.func.isRequired,
  skipOnboarding: PropTypes.func.isRequired,
  emailInputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  generateBtnRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  advancedOptionsRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  responseAreaRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  shortcutsRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
};

const EmailComposer = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [devMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  const [responseHistory, setResponseHistory] = useState([]);
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

  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'error', or 'info'

  const {
    customerEmail,
    setCustomerEmail,
    businessContext,
    setBusinessContext,
    tone,
    setTone,
    generatedResponse,
    editedResponse,
    setEditedResponse,
    isGenerating,
    error,
    generateResponse,
    saveResponse,
  } = useEmailResponse();

  // Define keyboard shortcuts
  const shortcuts = [
    { keys: 'ctrl+enter', description: 'Generate response', category: 'Response' },
    { keys: 'ctrl+c', description: 'Copy response to clipboard', category: 'Response' },
    { keys: 'ctrl+s', description: 'Save response', category: 'Response' },
    { keys: 'escape', description: 'Reset form', category: 'Form' },
    { keys: 'alt+t', description: 'Change response tone', category: 'Settings' },
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+enter': () => {
      if (!isGenerating && customerEmail.trim()) {
        generateResponse();
      }
    },
    'ctrl+c': () => {
      if (editedResponse) {
        handleCopy();
      }
    },
    'ctrl+s': () => {
      if (editedResponse) {
        handleSave();
      }
    },
    escape: () => {
      setCustomerEmail('');
      setBusinessContext('');
      setTone('professional');
      setEditedResponse('');
      setToastMessage('Form reset successfully');
      setToastType('info');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  // Function to fetch the user's last 5 email responses
  const fetchResponseHistory = useCallback(async () => {
    if (!user && !devMode) {
      console.warn('User not authenticated, cannot fetch response history');
      return;
    }

    try {
      setLoading(true);

      // Use mock data in development mode
      if (devMode) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Return mock history data
        setResponseHistory([
          {
            id: 'mock-1',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email:
              'I recently purchased your product and have some questions about the features. Can you help?',
            generated_response:
              "Thank you for your recent purchase! I'd be happy to answer any questions you have about our product features.",
            tone_requested: 'friendly',
          },
          {
            id: 'mock-2',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email: 'I would like to request a refund for my recent order #12345.',
            generated_response:
              'I understand you would like a refund for order #12345. We can process this request immediately for you.',
            tone_requested: 'professional',
          },
          {
            id: 'mock-3',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            customer_email: 'Your product arrived damaged. I expect immediate resolution.',
            generated_response:
              'We sincerely apologize that your product arrived damaged. We take this matter very seriously and will resolve this immediately.',
            tone_requested: 'empathetic',
          },
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
      setLoading(false);
    }
  }, [user, devMode, supabase]);

  // Fetch response history on component mount
  useEffect(() => {
    if (user || devMode) {
      fetchResponseHistory();
    }
  }, [user, devMode, fetchResponseHistory]);

  // Auto-generate response when customerEmail content changes and autoGenerate is enabled
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (autoGenerate && customerEmail.trim() && !loading && generateResponse) {
        generateResponse();
      }
    }, 800); // 800ms debounce delay

    return () => clearTimeout(delayDebounce);
  }, [customerEmail, autoGenerate, loading, generateResponse]);

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

  // Function to format a date string
  // const formatDate = (dateString) => {
  //   const options = {
  //     month: 'short',
  //     day: 'numeric',
  //     year: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //   };
  //   return new Date(dateString).toLocaleDateString(undefined, options);
  // };

  // Function to truncate text with ellipsis
  // const truncateText = (text, maxLength = 100) => {
  //   if (!text || text.length <= maxLength) return text;
  //   return text.substring(0, maxLength) + '...';
  // };

  // Function to load a previous response
  // const loadPreviousResponse = (email, response) => {
  //   setCustomerEmail(email);
  //   setEditedResponse(response);
  //   // Scroll to the top
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  // Function to handle next onboarding step
  // const nextOnboardingStep = () => {
  //   if (onboardingStep < 5) {
  //     setOnboardingStep((prevStep) => prevStep + 1);
  //   } else {
  //     completeOnboarding();
  //   }
  // };

  // Function to handle previous onboarding step
  // const prevOnboardingStep = () => {
  //   if (onboardingStep > 0) {
  //     setOnboardingStep((prevStep) => prevStep - 1);
  //   }
  // };

  // Function to skip onboarding
  // const skipOnboarding = () => {
  //   completeOnboarding();
  // };

  // Function to mark onboarding as complete
  const completeOnboarding = async () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);

    // Save onboarding state to localStorage for faster UX on next visit
    localStorage.setItem('replyrocket_onboarding_complete', 'true');

    // If in dev mode, just save the state locally
    if (devMode) {
      localStorage.setItem('dev_skip_onboarding', 'true');
      return;
    }

    // Save onboarding completion to database if user is authenticated
    if (user && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving onboarding status:', error);
        }
      } catch (err) {
        console.error('Error saving onboarding status:', err);
      }
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!editedResponse) return;

    try {
      await navigator.clipboard.writeText(editedResponse);
      // Show toast notification
      setToastMessage('Copied to clipboard successfully!');
      setToastType('success');
      setShowToast(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setToastMessage('Failed to copy to clipboard');
      setToastType('error');
      setShowToast(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  // Handle save response
  const handleSave = async () => {
    try {
      setLoading(true);
      await saveResponse();

      // Show toast notification
      setToastMessage('Response saved successfully!');
      setToastType('success');
      setShowToast(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Refresh response history
      fetchResponseHistory();
    } catch (err) {
      console.error('Error saving response:', err);
      setToastMessage('Failed to save response');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
      <header className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>Email Response Generator</h1>
        <KeyboardShortcutsHelp shortcuts={shortcuts} />
      </header>
      <p className='text-gray-600 mb-8'>
        Generate professional, personalized email responses in seconds using AI.
      </p>

      <main>
        <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <EmailForm
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              businessContext={businessContext}
              setBusinessContext={setBusinessContext}
              tone={tone}
              setTone={setTone}
              autoGenerate={autoGenerate}
              setAutoGenerate={setAutoGenerate}
              handleGenerate={generateResponse}
              isGenerating={isGenerating}
            />

            {error && (
              <div className='mt-4 rounded-md bg-red-50 p-4' role='alert' aria-live='assertive'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800'>Error</h3>
                    <div className='mt-2 text-sm text-red-700'>
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {generatedResponse && (
              <ResponseViewer
                generatedResponse={generatedResponse}
                editedResponse={editedResponse}
                setEditedResponse={setEditedResponse}
                responseTextareaRef={responseTextareaRef}
                handleSave={handleSave}
                handleCopy={handleCopy}
                isLoading={loading}
              />
            )}
          </div>
        </div>
      </main>

      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed bottom-4 right-4 rounded-md p-4 shadow-lg ${
            toastType === 'success'
              ? 'bg-green-100'
              : toastType === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
          }`}
          role='status'
          aria-live='polite'
        >
          <div className='flex items-center'>
            {toastType === 'success' && (
              <svg
                className='h-5 w-5 text-green-600 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {toastType === 'error' && (
              <svg
                className='h-5 w-5 text-red-600 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            <p
              className={`text-sm ${
                toastType === 'success'
                  ? 'text-green-800'
                  : toastType === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
              }`}
            >
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      <OnboardingTutorial
        showOnboarding={showOnboarding}
        onboardingStep={onboardingStep}
        nextOnboardingStep={() => {
          if (onboardingStep < 4) {
            setOnboardingStep(onboardingStep + 1);
          } else {
            completeOnboarding();
          }
        }}
        prevOnboardingStep={() => {
          if (onboardingStep > 0) {
            setOnboardingStep(onboardingStep - 1);
          }
        }}
        skipOnboarding={completeOnboarding}
        emailInputRef={emailInputRef}
        generateBtnRef={generateBtnRef}
        advancedOptionsRef={advancedOptionsRef}
        responseAreaRef={responseAreaRef}
        shortcutsRef={shortcutsRef}
      />
    </div>
  );
};

export default EmailComposer;
