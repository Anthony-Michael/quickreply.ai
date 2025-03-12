import { useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { generateEmailResponse } from '../lib/openai';

/**
 * Custom hook for managing email response generation
 *
 * This hook encapsulates the state and logic for generating email responses,
 * making the component that uses it more focused on rendering and user interaction.
 *
 * @returns {Object} State values and functions for email response generation
 */
export const useEmailResponse = () => {
  // State for input fields
  const [customerEmail, setCustomerEmail] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [tone, setTone] = useState('professional');

  // State for generated response
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [editedResponse, setEditedResponse] = useState('');

  // State for generation process
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Get user and Supabase client
  const user = useUser();
  const supabase = useSupabaseClient();

  /**
   * Generates an email response based on the provided inputs
   *
   * @returns {Promise<void>}
   */
  const generateResponse = async () => {
    // Validate inputs
    if (!customerEmail.trim()) {
      setError('Please enter a customer email');
      return;
    }

    // Reset state
    setError(null);
    setIsGenerating(true);

    try {
      // Generate response
      const response = await generateEmailResponse(customerEmail, businessContext, tone);

      // Update state with generated response
      setGeneratedResponse(response);
      setEditedResponse(response);

      // Save to history if user is authenticated
      if (user && supabase) {
        try {
          const { error: dbError } = await supabase.from('email_responses').insert({
            user_id: user.id,
            customer_email: customerEmail,
            business_context: businessContext,
            tone: tone,
            generated_response: response,
            final_response: response,
          });

          if (dbError) {
            console.error('Error saving response to history:', dbError);
          }
        } catch (dbError) {
          console.error('Error saving response to history:', dbError);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setError(error.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Saves the edited response to the database
   *
   * @returns {Promise<void>}
   */
  const saveResponse = async () => {
    if (!user || !supabase || !generatedResponse) {
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('email_responses')
        .update({ final_response: editedResponse })
        .eq('user_id', user.id)
        .eq('generated_response', generatedResponse);

      if (dbError) {
        console.error('Error updating response:', dbError);
        setError('Failed to save response. Please try again.');
      }
    } catch (error) {
      console.error('Error updating response:', error);
      setError('Failed to save response. Please try again.');
    }
  };

  /**
   * Resets all state values
   */
  const resetAll = () => {
    setCustomerEmail('');
    setBusinessContext('');
    setTone('professional');
    setGeneratedResponse('');
    setEditedResponse('');
    setError(null);
  };

  return {
    // State
    customerEmail,
    setCustomerEmail,
    businessContext,
    setBusinessContext,
    tone,
    setTone,
    generatedResponse,
    setGeneratedResponse,
    editedResponse,
    setEditedResponse,
    isGenerating,
    error,

    // Functions
    generateResponse,
    saveResponse,
    resetAll,
  };
};
