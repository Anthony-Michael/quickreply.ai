// src/lib/openai.js
import { supabase } from './supabase';

// Constants for API configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const DEFAULT_MAX_TOKENS = 800;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MODEL = 'gpt-4';

// Helper function to add delay between retries
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to check rate limits for a user
async function checkRateLimits(userId) {
  // Get current timestamp for the last hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // Count requests in the last hour
  const { count, error } = await supabase
    .from('api_request_logs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', hourAgo);
    
  if (error) {
    console.error('Error checking rate limits:', error);
    throw new Error('Could not verify rate limits');
  }
  
  // Get user's hourly limit based on subscription tier
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, hourly_request_limit')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    throw new Error('Could not verify user subscription');
  }
  
  // Check if user has exceeded their hourly limit
  if (count >= userProfile.hourly_request_limit) {
    throw new Error('Hourly rate limit reached. Please try again later or upgrade your plan.');
  }
  
  return true;
}

// Function to log API request details
async function logApiRequest(userId, requestDetails) {
  try {
    const { error } = await supabase
      .from('api_request_logs')
      .insert({
        user_id: userId,
        model: requestDetails.model,
        tokens_used: requestDetails.tokens_used,
        response_time_ms: requestDetails.response_time_ms,
        request_type: requestDetails.request_type,
        success: requestDetails.success
      });
      
    if (error) {
      console.error('Error logging API request:', error);
    }
  } catch (err) {
    console.error('Failed to log API request:', err);
  }
}

// Function to generate AI response using OpenAI API with streaming
export async function generateEmailResponse(customerEmail, businessContext, tone = 'professional', maxTokens = DEFAULT_MAX_TOKENS) {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;
  
  // Start timing the request
  const startTime = Date.now();
  
  // Check if user has remaining credits
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, monthly_responses_used, monthly_responses_limit')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    throw new Error('Could not verify usage limits');
  }
  
  if (userProfile.monthly_responses_used >= userProfile.monthly_responses_limit) {
    throw new Error('Monthly response limit reached. Please upgrade your plan.');
  }
  
  // Check rate limits
  await checkRateLimits(userId);
  
  // Extract key information from the customer email
  const emailSubject = extractSubject(customerEmail);
  const customerName = extractCustomerName(customerEmail);
  const emailBody = extractEmailBody(customerEmail);
  
  // Prepare the prompt for OpenAI
  const prompt = `
    You are a helpful customer service representative for a business. 
    Write a professional email response to the following customer email.
    
    Business context: ${businessContext || 'A small business providing excellent customer service'}
    Desired tone: ${tone}
    
    Original customer email:
    Subject: ${emailSubject}
    From: ${customerName}
    
    ${emailBody}
    
    Write a helpful, friendly, and professional response addressing the customer's needs.
    If you need more information to properly respond, include that in your response politely.
    Sign the email as "Customer Support Team" at the end.
  `;
  
  // Create the payload for OpenAI
  const payload = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that writes professional email responses.' },
      { role: 'user', content: prompt }
    ],
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: maxTokens,
    stream: true // Enable streaming
  };
  
  let attempts = 0;
  let generatedResponse = '';
  let success = false;
  let tokensUsed = 0;
  
  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      // Make the API request to OpenAI with streaming enabled
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate response');
      }
      
      // Handle the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      generatedResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                generatedResponse += data.choices[0].delta.content;
              }
              
              // Update token usage if provided
              if (data.usage && data.usage.total_tokens) {
                tokensUsed = data.usage.total_tokens;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
      
      success = true;
      break; // Successfully got a response, exit the retry loop
      
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      if (attempts >= MAX_RETRIES) {
        throw new Error('Failed to generate response after multiple attempts. Please try again later.');
      }
      await wait(RETRY_DELAY * attempts); // Exponential backoff
    }
  }
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  
  // Log the API request
  await logApiRequest(userId, {
    model: DEFAULT_MODEL,
    tokens_used: tokensUsed,
    response_time_ms: responseTime,
    request_type: 'email_response',
    success
  });
  
  if (success) {
    // Update the user's response count
    await supabase
      .from('profiles')
      .update({
        monthly_responses_used: userProfile.monthly_responses_used + 1
      })
      .eq('id', userId);
      
    // Log the generation in the history
    await supabase
      .from('email_history')
      .insert({
        user_id: userId,
        customer_email: customerEmail,
        generated_response: generatedResponse,
        context_provided: businessContext,
        tone_requested: tone,
        tokens_used: tokensUsed,
        response_time_ms: responseTime
      });
    
    return generatedResponse.trim();
  } else {
    throw new Error('Failed to generate response. Please try again later.');
  }
}

// Function to handle non-streaming API calls when needed
export async function callOpenAiApi(prompt, options = {}) {
  const { 
    model = DEFAULT_MODEL, 
    maxTokens = DEFAULT_MAX_TOKENS, 
    temperature = DEFAULT_TEMPERATURE,
    streaming = false
  } = options;
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;
  
  // Start timing the request
  const startTime = Date.now();
  
  // Check rate limits
  await checkRateLimits(userId);
  
  // Create the payload for OpenAI
  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: maxTokens,
    stream: streaming
  };
  
  let attempts = 0;
  let success = false;
  let responseData = null;
  let tokensUsed = 0;
  
  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }
      
      if (streaming) {
        // Handle streaming similar to generateEmailResponse
        // Implementation would be similar to the streaming code above
      } else {
        // Handle regular response
        const data = await response.json();
        responseData = data.choices[0].message.content.trim();
        tokensUsed = data.usage.total_tokens;
      }
      
      success = true;
      break; // Successfully got a response, exit the retry loop
      
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      if (attempts >= MAX_RETRIES) {
        throw new Error('API request failed after multiple attempts');
      }
      await wait(RETRY_DELAY * attempts); // Exponential backoff
    }
  }
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  
  // Log the API request
  await logApiRequest(userId, {
    model,
    tokens_used: tokensUsed,
    response_time_ms: responseTime,
    request_type: 'general_api_call',
    success
  });
  
  if (success) {
    return responseData;
  } else {
    throw new Error('API request failed');
  }
}

// Helper functions to extract information from emails
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
