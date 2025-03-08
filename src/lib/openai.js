// src/lib/openai.js
import { supabase } from './supabase';

// Function to generate AI response using OpenAI API
export async function generateEmailResponse(customerEmail, businessContext, tone = 'professional') {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user has remaining credits
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, monthly_responses_used, monthly_responses_limit')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    throw new Error('Could not verify usage limits');
  }
  
  if (userProfile.monthly_responses_used >= userProfile.monthly_responses_limit) {
    throw new Error('Monthly response limit reached. Please upgrade your plan.');
  }
  
  // Extract key information from the customer email
  // This is a simple implementation - you may want to enhance this with more NLP
  const emailSubject = extractSubject(customerEmail);
  const customerName = extractCustomerName(customerEmail);
  const emailBody = extractEmailBody(customerEmail);
  
  try {
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
    
    // Make the API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes professional email responses.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate response');
    }
    
    const data = await response.json();
    const generatedResponse = data.choices[0].message.content.trim();
    
    // Update the user's response count
    await supabase
      .from('profiles')
      .update({
        monthly_responses_used: userProfile.monthly_responses_used + 1
      })
      .eq('id', user.id);
      
    // Log the generation in the history
    await supabase
      .from('email_history')
      .insert({
        user_id: user.id,
        customer_email: customerEmail,
        generated_response: generatedResponse,
        context_provided: businessContext,
        tone_requested: tone
      });
    
    return generatedResponse;
  } catch (error) {
    console.error('Error generating email response:', error);
    throw new Error('Failed to generate response. Please try again later.');
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
