import React, { useState } from 'react';
import { generateEmailResponse } from '../lib/openai';
import { supabase } from '../lib/supabase';

const EmailComposer = () => {
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGenerate = async () => {
    if (!customerEmail.trim()) {
      setError('Please paste a customer email to generate a response');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await generateEmailResponse(
        customerEmail,
        businessContext,
        tone
      );
      
      setGeneratedResponse(response);
      setEditedResponse(response);
      setSuccessMessage('Response generated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to generate response. Please try again.');
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          template_name: templateName,
          template_content: editedResponse,
          category: 'custom'
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
    setSuccessMessage('Response copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Generate Email Response</h1>
      
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
      
      <div className="mb-6">
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Email
        </label>
        <textarea
          id="customerEmail"
          rows={10}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste the customer email here..."
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="businessContext" className="block text-sm font-medium text-gray-700 mb-1">
            Business Context (Optional)
          </label>
          <textarea
            id="businessContext"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide context about your business or specific policies..."
            value={businessContext}
            onChange={(e) => setBusinessContext(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
            Response Tone
          </label>
          <select
            id="tone"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </div>
      
      {generatedResponse && (
        <>
          <div className="mb-6">
            <label htmlFor="editedResponse" className="block text-sm font-medium text-gray-700 mb-1">
              Generated Response (Edit as needed)
            </label>
            <textarea
              id="editedResponse"
              rows={12}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Copy to Clipboard
            </button>
            
            <button
              onClick={handleSaveTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save as Template
            </button>
            
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailComposer;
