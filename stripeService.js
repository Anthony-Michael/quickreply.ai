import { supabase } from './supabaseClient';

export const updateSubscription = async (userId, newPlan) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Call Stripe API to update subscription
    const response = await fetch('/api/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPlan })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update subscription');
    }
    
    // Update user record in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_plan: newPlan })
      .eq('id', userId);
      
    if (error) throw error;
    
    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
} 