import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';

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
  // Run reset_monthly_usage() function if needed for users at the beginning of billing cycle
  // This executes the function in Supabase to reset usage counts for eligible users
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

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Extract request parameters
    const { customerEmail, businessContext, tone = 'professional' } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Check if user has remaining credits BEFORE making the OpenAI request
    const usageCheck = await checkUserUsageLimits(user.id);
    
    if (usageCheck.limitReached) {
      return res.status(403).json({ 
        error: usageCheck.error.message,
        errorCode: usageCheck.error.code,
        currentUsage: usageCheck.profile.monthly_responses_used,
        limit: usageCheck.profile.monthly_responses_limit,
        tier: usageCheck.profile.subscription_tier
      });
    }

    // Extract key information from the customer email
    const emailSubject = extractSubject(customerEmail);
    const customerName = extractCustomerName(customerEmail);
    const emailBody = extractEmailBody(customerEmail);

    // Get business details for personalization
    const businessName = usageCheck.profile.business_name || 'Our Company';
    const businessDescription = usageCheck.profile.business_description || 'A business committed to excellent customer service';

    // Prepare the prompt for OpenAI
    const prompt = `
      You are a knowledgeable customer service representative for ${businessName}.
      
      BUSINESS INFORMATION:
      - Company name: ${businessName}
      - Business description: ${businessDescription}
      - Additional context: ${businessContext || 'No additional context provided'}
      
      STYLE GUIDELINES:
      - Tone: ${tone} 
      - Match your writing style to reflect the business description
      - Use language that aligns with ${businessName}'s brand and values
      - If the business sounds formal in their description, maintain that formality
      - If the business sounds casual or friendly, adopt a similar approachable style
      
      CUSTOMER EMAIL:
      Subject: ${emailSubject}
      From: ${customerName}
      Body:
      ${emailBody}
      
      RESPONSE INSTRUCTIONS:
      1. Address the customer by name if available
      2. Reference their specific inquiry or issue
      3. Provide helpful, accurate information that directly addresses their needs
      4. If you need more details to resolve their issue, politely request the specific information needed
      5. Include next steps or follow-up information when appropriate
      6. Sign the email as "${businessName} Support Team" at the end
      7. Keep the response concise yet thorough
      
      Write a complete, professional email response maintaining ${businessName}'s brand voice.
    `;

    try {
      // Increment the usage count BEFORE making the API request to prevent exceeding limits
      await incrementUserResponseCount(user.id, usageCheck.profile.monthly_responses_used);
      
      // Start timing the request
      const startTime = Date.now();
      
      // Make the OpenAI request with retry logic
      const generatedResponse = await makeOpenAIRequest(prompt, 3);

      // Log the generation in the history
      await supabaseAdmin.from('email_history').insert({
        user_id: user.id,
        customer_email: customerEmail,
        generated_response: generatedResponse,
        context_provided: businessContext,
        tone_requested: tone,
        business_name_used: businessName,
        response_time_ms: Date.now() - startTime
      });

      // Return the generated response
      return res.status(200).json({ 
        response: generatedResponse,
        businessName: businessName, // Return the business name for frontend use
        currentUsage: usageCheck.profile.monthly_responses_used + 1,
        limit: usageCheck.profile.monthly_responses_limit
      });
    } catch (apiError) {
      // If API call fails, we should revert the usage increment to not charge the user
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            monthly_responses_used: usageCheck.profile.monthly_responses_used, // Revert to original value
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (revertError) {
        console.error('Failed to revert usage count:', revertError);
      }
      
      console.error('OpenAI API error after retries:', apiError);
      return res.status(503).json({ 
        error: 'Failed to generate response after multiple attempts. Please try again later.',
        details: apiError.message
      });
    }
  } catch (error) {
    console.error('Error in request processing:', error);
    return res.status(500).json({ error: 'Failed to process request. Please try again later.' });
  }
}

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