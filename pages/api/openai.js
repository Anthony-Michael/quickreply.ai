import OpenAI from 'openai';
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';
import { corsMiddleware } from './cors-middleware';
import { cacheOrFetch, invalidateCache } from './utils/redis-client';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define cache keys
const USER_PROFILE_CACHE_KEY = userId => `user:profile:${userId}`;
const USER_USAGE_CACHE_KEY = userId => `user:usage:${userId}`;

// Mock response generator for development use
function generateMockResponse(customerEmail, businessName, tone) {
  console.log('Generating mock response in development mode');
  const toneResponses = {
    professional: `Dear Customer,\n\nThank you for reaching out to ${businessName}. We appreciate your inquiry.\n\nWe've reviewed your request and would be happy to assist you. Our team is working on addressing your specific needs and will provide a comprehensive solution shortly.\n\nShould you have any further questions, please don't hesitate to contact us.\n\nBest regards,\n${businessName} Support Team`,
    friendly: `Hi there!\n\nThanks so much for getting in touch with us at ${businessName}! We're really excited to hear from you.\n\nWe've got your message and we're already working on a great solution for you. We love helping our customers with these kinds of questions!\n\nFeel free to reach out if you need anything else at all.\n\nCheers!\n${businessName} Support Team`,
    formal: `Dear Valued Customer,\n\nWe hereby acknowledge receipt of your correspondence to ${businessName}.\n\nYour inquiry has been duly noted and is currently under review by our relevant department. We shall endeavor to provide you with a comprehensive response in due course.\n\nKindly be advised that should you require any further assistance, we remain at your disposal.\n\nYours faithfully,\n${businessName} Support Team`,
    empathetic: `Hello,\n\nI understand how important this matter is to you, and I want to assure you that we at ${businessName} are here to help.\n\nWe appreciate you sharing your concerns with us. Your experience matters greatly, and we're committed to finding a solution that works for you.\n\nPlease know that we're here to support you every step of the way.\n\nWith warm regards,\n${businessName} Support Team`,
    concise: `Thank you for contacting ${businessName}.\n\nWe're addressing your inquiry now.\n\nExpect a solution shortly.\n\nRegards,\n${businessName} Support Team`
  };

  return toneResponses[tone] || toneResponses.professional;
}

// Function to make OpenAI API requests with retries
async function makeOpenAIRequest(prompt, maxRetries = 3) {
  // Check if we should use mock responses
  if (process.env.ENABLE_MOCK_RESPONSES === 'true') {
    // Extract business name from prompt for the mock response
    const businessNameMatch = prompt.match(/Company name: (.*?)$/m);
    const businessName = businessNameMatch ? businessNameMatch[1].trim() : 'Our Company';
    
    // Extract tone from prompt
    const toneMatch = prompt.match(/Tone: (.*?)$/m);
    const tone = toneMatch ? toneMatch[1].trim() : 'professional';
    
    // Extract customer email from prompt
    const emailBodyMatch = prompt.match(/Body:\s*([\s\S]*?)$/m);
    const customerEmail = emailBodyMatch ? emailBodyMatch[1].trim() : '';
    
    // Return mock response after a small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateMockResponse(customerEmail, businessName, tone);
  }

  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      // Calculate exponential backoff delay (0ms on first attempt)
      const backoffDelay = retryCount === 0 ? 0 : Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
      
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount}/${maxRetries} for OpenAI request after ${backoffDelay}ms delay`);
        // Wait for the backoff period before retrying
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      // Make the API request to OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that writes professional email responses.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
        // Add timeout to the request to prevent hanging
        timeout: 30000, // 30 seconds
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        // Handle rate limiting separately - always retry these with longer backoff
        if (openaiResponse.status === 429) {
          console.warn('OpenAI rate limit reached. Retrying with longer backoff...');
          throw new Error('Rate limit exceeded');
        }
        
        // For 5xx errors (server errors), we should retry
        if (openaiResponse.status >= 500 && openaiResponse.status < 600) {
          throw new Error(`OpenAI server error: ${openaiResponse.status}`);
        }
        
        // For 4xx errors other than 429, we should not retry as they're client errors
        if (openaiResponse.status >= 400 && openaiResponse.status < 500 && openaiResponse.status !== 429) {
          const errorMsg = errorData.error?.message || `OpenAI client error: ${openaiResponse.status}`;
          throw new Error(errorMsg, { cause: { shouldRetry: false } });
        }
        
        throw new Error(errorData.error?.message || 'Failed to generate response');
      }

      const data = await openaiResponse.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      lastError = error;
      
      // If the error explicitly says not to retry, don't retry
      if (error.cause && error.cause.shouldRetry === false) {
        console.error('Non-retriable error during OpenAI request:', error.message);
        break;
      }
      
      retryCount++;
      console.warn(`OpenAI request failed (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      // If we've exhausted all retries, give up
      if (retryCount > maxRetries) {
        console.error('All OpenAI retry attempts failed');
        break;
      }
    }
  }
  
  // If we get here with lastError, all retries failed
  throw lastError || new Error('Failed to generate response after multiple attempts');
}

/**
 * Checks user's subscription usage and enforces limits
 * @param {string} userId - The user's ID
 * @returns {Object} - Result of the check with user profile data
 */
async function checkUserUsageLimits(userId) {
  // Use caching function to avoid repeated database calls
  const checkUsage = async () => {
    // Run reset_monthly_usage() function if needed for users at the beginning of billing cycle
    await supabaseAdmin.rpc('reset_monthly_usage');
    
    // Fetch current user profile with usage information
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, monthly_responses_used, monthly_responses_limit, business_name, business_description, subscription_end_date')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Could not verify usage limits');
    }
    
    // Check if user has reached their monthly limit
    if (userProfile.monthly_responses_used >= userProfile.monthly_responses_limit) {
      return {
        limitReached: true,
        profile: userProfile,
        error: {
          message: 'You have reached your AI response limit. Upgrade your plan for more responses.',
          code: 'MONTHLY_LIMIT_REACHED'
        }
      };
    }
    
    // Check if subscription has expired
    if (userProfile.subscription_end_date && new Date(userProfile.subscription_end_date) < new Date()) {
      return {
        limitReached: true,
        profile: userProfile,
        error: {
          message: 'Your subscription has expired. Please renew your plan to continue using AI responses.',
          code: 'SUBSCRIPTION_EXPIRED'
        }
      };
    }
    
    // User has available responses
    return {
      limitReached: false,
      profile: userProfile
    };
  };
  
  // Cache user usage checks for 2 minutes
  return await cacheOrFetch(USER_USAGE_CACHE_KEY(userId), checkUsage, 120);
}

/**
 * Increments the user's response usage count
 * @param {string} userId - The user's ID
 * @param {number} currentUsage - Current usage count
 * @returns {Object} - Result of the update operation
 */
async function incrementUserResponseCount(userId, currentUsage) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      monthly_responses_used: currentUsage + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating user response count:', error);
    throw new Error('Failed to update usage tracking');
  }
  
  return { success: true };
}

// Function to handle non-streaming API calls when needed
export async function callOpenAiApi(prompt, options = {}) {
  // ... existing code ...
}

// Convert the default export to a named handler that can be wrapped with CORS middleware
const openaiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Extract the params from the request body
    const { customerEmail, context, tone, model = 'gpt-3.5-turbo' } = req.body;
    
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Check user usage limits
    const { limitReached, profile, error: usageError } = await checkUserUsageLimits(user.id);
    
    if (usageError) {
      return res.status(402).json({ error: usageError.message, code: usageError.code });
    }
    
    if (limitReached) {
      return res.status(402).json({ 
        error: 'Usage limit reached', 
        subscription: profile.subscription_tier,
        usageLimit: profile.monthly_responses_limit,
        usageCount: profile.monthly_responses_used,
        code: 'USAGE_LIMIT_REACHED'
      });
    }

    // Generate the email response
    const startTime = Date.now();
    const response = await generateEmailResponse(customerEmail, context, tone, model);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Increment the user's usage count
    await incrementUserResponseCount(user.id, profile.monthly_responses_used || 0);
    
    // Invalidate the user profile and usage cache
    await invalidateCache(USER_PROFILE_CACHE_KEY(user.id));
    await invalidateCache(USER_USAGE_CACHE_KEY(user.id));

    // Store the generated response in the database
    await storeEmailResponse(
      user.id,
      customerEmail,
      response,
      context,
      tone,
      responseTime
    );

    return res.status(200).json({
      response,
      usage: {
        count: profile.monthly_responses_used + 1,
        limit: profile.monthly_responses_limit,
        subscription: profile.subscription_tier
      }
    });
  } catch (error) {
    console.error('Error generating response:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
};

// Export the handler with CORS middleware
export default corsMiddleware(openaiHandler);

// Helper functions to extract information from emails
function extractSubject(email) {
  const subjectMatch = email.match(/Subject: (.*?)(?:\n|$)/i);
  return subjectMatch ? subjectMatch[1].trim() : 'No Subject';
}

function extractCustomerName(email) {
  const fromMatch = email.match(/From: (.*?)(?:\n|<|$)/i);
  return fromMatch ? fromMatch[1].trim() : 'Customer';
}

function extractEmailBody(email) {
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
 * Generates an email response using OpenAI
 * @param {string} customerEmail - The customer's email to respond to
 * @param {string} context - Additional context for the response
 * @param {string} tone - The desired tone of the response
 * @param {string} model - The OpenAI model to use
 * @returns {string} - The generated email response
 */
async function generateEmailResponse(customerEmail, context = '', tone = 'professional', model = 'gpt-3.5-turbo') {
  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an email assistant helping to craft professional responses to customer emails. ${
            tone ? `Please write in a ${tone} tone.` : ''
          } ${context ? `Additional context: ${context}` : ''}`
        },
        {
          role: 'user',
          content: `Please help me respond to this email from a customer: "${customerEmail}"`
        }
      ];
      
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error;
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  // If we get here with lastError, all retries failed
  throw lastError || new Error('Failed to generate response after multiple attempts');
}

/**
 * Stores the email response in the database
 * @param {string} userId - The user's ID
 * @param {string} customerEmail - The customer's email
 * @param {string} response - The generated response
 * @param {string} context - Additional context used
 * @param {string} tone - The tone that was requested
 * @param {number} responseTime - Time taken to generate the response in ms
 */
async function storeEmailResponse(userId, customerEmail, response, context, tone, responseTime) {
  try {
    await supabaseAdmin.from('email_history').insert({
      user_id: userId,
      customer_email: customerEmail,
      generated_response: response,
      context_provided: context || null,
      tone_requested: tone || null,
      response_time_ms: responseTime
    });
  } catch (error) {
    // Log but don't throw - we don't want to fail the request if storage fails
    console.error('Error storing email response:', error);
  }
} 