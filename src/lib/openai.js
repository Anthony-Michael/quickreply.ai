// src/lib/openai.js

// Function to generate AI response using our secure API
export async function generateEmailResponse(customerEmail, businessContext, tone = 'professional', token) {
  try {
    // Check if token is provided (should be passed from the component)
    if (!token) {
      throw new Error('You must be logged in to generate responses');
    }

    // Create a fallback response in case of errors
    const fallbackResponse = {
      response: 'Thank you for your email. We appreciate your interest in our services. Our team will review your questions and get back to you with detailed information shortly. If you have any urgent inquiries, please don\'t hesitate to call our customer service line.',
      businessName: 'Our Company'
    };

    try {
      // Call our secure API endpoint
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerEmail,
          businessContext,
          tone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for subscription limit error
        if (response.status === 403 && errorData.errorCode === 'SUBSCRIPTION_LIMIT_REACHED') {
          // Create a custom error with all the subscription details
          const subscriptionError = new Error(errorData.error);
          subscriptionError.errorCode = errorData.errorCode;
          subscriptionError.currentUsage = errorData.currentUsage;
          subscriptionError.limit = errorData.limit;
          subscriptionError.tier = errorData.tier;
          throw subscriptionError;
        }
        
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      
      // Return both the response text and business name
      return {
        response: data.response || fallbackResponse.response,
        businessName: data.businessName || fallbackResponse.businessName
      };
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // If this is a subscription error, rethrow it
      if (apiError.errorCode === 'SUBSCRIPTION_LIMIT_REACHED') {
        throw apiError;
      }
      
      // For development mode or other errors, return a mock response
      console.warn('Falling back to default response');
      return fallbackResponse;
    }
  } catch (error) {
    console.error('Error generating email response:', error);
    throw error;
  }
}

// Helper functions for email parsing
function extractSubject(email) {
  // Basic extraction - in a real app, you'd use a proper email parser
  const subjectMatch = email.match(/Subject: (.*?)(?:\n|$)/i);
  return subjectMatch ? subjectMatch[1].trim() : 'No Subject';
}

function extractCustomerName(email) {
  // Basic extraction - in a real app, you'd use a proper email parser
  const fromMatch = email.match(/From: (.*?)(?:\n|<|$)/i);
  return fromMatch ? fromMatch[1].trim() : 'Customer';
}

function extractEmailBody(email) {
  // Basic extraction - this is simplified
  const lines = email.split('\n');
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      bodyStartIndex = i + 1;
      break;
    }
  }

  return lines.slice(bodyStartIndex).join('\n').trim();
}
