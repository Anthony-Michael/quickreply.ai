// src/lib/openai.js

/**
 * Generates an email response using the OpenAI API.
 * @param {string} customerEmail - The customer's email content.
 * @param {string} businessContext - The business context for the response.
 * @param {string} tone - The desired tone for the response (e.g., 'professional', 'friendly', 'empathetic').
 * @returns {Promise<string>} - A promise that resolves to the generated email response.
 * @throws {Error} - If the user has exceeded the rate limit or if there is an error generating the response.
 */
export async function generateEmailResponse(
  customerEmail,
  businessContext,
  tone = 'professional',
  token
) {
  try {
    // Check if token is provided (should be passed from the component)
    if (!token) {
      throw new Error('You must be logged in to generate responses');
    }

    // Create a fallback response in case of errors
    const fallbackResponse = {
      response:
        "Thank you for your email. We appreciate your interest in our services. Our team will review your questions and get back to you with detailed information shortly. If you have any urgent inquiries, please don't hesitate to call our customer service line.",
      businessName: 'Our Company',
    };

    try {
      // Call our secure API endpoint
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerEmail,
          businessContext,
          tone,
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
        businessName: data.businessName || fallbackResponse.businessName,
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

/**
 * Checks if the user has exceeded the rate limit for OpenAI API requests.
 * @param {Object} user - The user object.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has exceeded the rate limit, false otherwise.
 */
export async function checkRateLimit(user) {
  // ... existing code ...
}

/**
 * Logs an OpenAI API request to the database.
 * @param {Object} user - The user object.
 * @param {string} model - The OpenAI model used for the request.
 * @param {number} tokensUsed - The number of tokens used in the request.
 * @returns {Promise<void>} - A promise that resolves when the request is logged.
 */
async function logApiRequest(user, model, tokensUsed) {
  // ... existing code ...
}
