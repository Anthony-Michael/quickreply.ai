// email-service.js - Email notification service for ReplyRocket.io

const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('./supabase-admin');

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send an email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email plain text content
 * @returns {Promise<Object>} - Email send result
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    // Log the email attempt
    console.log(`Sending email to ${to} with subject: ${subject}`);
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"ReplyRocket Support" <${process.env.EMAIL_FROM || 'noreply@replyrocket.io'}>`,
      to,
      subject,
      text,
      html,
    });
    
    // Log the successful send
    console.log(`Email sent: ${info.messageId}`);
    
    // Log to database for audit trail
    try {
      await supabaseAdmin
        .from('email_notifications')
        .insert({
          recipient: to,
          subject,
          type: 'system',
          status: 'sent',
          message_id: info.messageId
        });
    } catch (dbError) {
      // Don't fail the function if logging fails
      console.error('Error logging email to database:', dbError);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed attempt to database
    try {
      await supabaseAdmin
        .from('email_notifications')
        .insert({
          recipient: to,
          subject,
          type: 'system',
          status: 'failed',
          error: error.message
        });
    } catch (dbError) {
      // Just log this, already in an error state
      console.error('Error logging email failure to database:', dbError);
    }
    
    throw error;
  }
}

/**
 * Send a payment failure notification
 * @param {string} userId - User ID
 * @param {Object} paymentDetails - Details about the failed payment
 * @returns {Promise<Object>} - Email send result
 */
async function sendPaymentFailureNotification(userId, paymentDetails) {
  try {
    // Get user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      throw new Error(`Could not find user with ID ${userId}: ${error?.message || 'User not found'}`);
    }
    
    // Format the retry date
    const retryDate = new Date(paymentDetails.next_payment_attempt * 1000);
    const formattedRetryDate = retryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Format grace period end date (14 days from now)
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);
    const formattedGracePeriodEnd = gracePeriodEnd.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Calculate days remaining in grace period
    const daysRemaining = 14;
    
    // Prepare email content
    const subject = 'Action Required: Payment Failed for Your ReplyRocket Subscription';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://replyrocket.io/logo.png" alt="ReplyRocket Logo" style="max-width: 200px;">
        </div>
        
        <h2 style="color: #333; text-align: center;">Payment Failed</h2>
        
        <p>Hello,</p>
        
        <p>We were unable to process your payment for your ReplyRocket ${user.subscription_tier} subscription. Your card may have been declined, expired, or there may be insufficient funds.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Payment Information:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>Amount: $${(paymentDetails.amount_due / 100).toFixed(2)} ${paymentDetails.currency.toUpperCase()}</li>
            <li>Next retry: ${formattedRetryDate}</li>
            <li>Grace period ends: ${formattedGracePeriodEnd}</li>
          </ul>
        </div>
        
        <p><strong>What happens next?</strong></p>
        
        <p>Don't worry! Your service will continue uninterrupted during a 14-day grace period. We'll automatically try to charge your card again on ${formattedRetryDate}.</p>
        
        <p>To ensure continued access to all ReplyRocket features:</p>
        
        <ol>
          <li>Check your payment method details in your account settings</li>
          <li>Update your billing information if necessary</li>
          <li>Contact your bank if you have questions about why the payment failed</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription" style="background-color: #4A90E2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Update Payment Method</a>
        </div>
        
        <p>If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.</p>
        
        <p>Thank you for using ReplyRocket!</p>
        
        <p>Best regards,<br>The ReplyRocket Team</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777; text-align: center;">
          <p>ReplyRocket.io &bull; Your Business Email Assistant</p>
          <p>If you have questions, please contact support@replyrocket.io</p>
        </div>
      </div>
    `;
    
    const text = `
      Payment Failed for Your ReplyRocket Subscription
      
      Hello,
      
      We were unable to process your payment for your ReplyRocket ${user.subscription_tier} subscription. Your card may have been declined, expired, or there may be insufficient funds.
      
      Payment Information:
      - Amount: $${(paymentDetails.amount_due / 100).toFixed(2)} ${paymentDetails.currency.toUpperCase()}
      - Next retry: ${formattedRetryDate}
      - Grace period ends: ${formattedGracePeriodEnd}
      
      What happens next?
      
      Don't worry! Your service will continue uninterrupted during a 14-day grace period. We'll automatically try to charge your card again on ${formattedRetryDate}.
      
      To ensure continued access to all ReplyRocket features:
      1. Check your payment method details in your account settings
      2. Update your billing information if necessary
      3. Contact your bank if you have questions about why the payment failed
      
      Visit ${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription to update your payment method.
      
      If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.
      
      Thank you for using ReplyRocket!
      
      Best regards,
      The ReplyRocket Team
      
      ------
      ReplyRocket.io • Your Business Email Assistant
      If you have questions, please contact support@replyrocket.io
    `;
    
    // Send the email
    return await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending payment failure notification:', error);
    throw error;
  }
}

/**
 * Send a grace period expiration warning
 * @param {string} userId - User ID
 * @param {number} daysRemaining - Days remaining in grace period
 * @returns {Promise<Object>} - Email send result
 */
async function sendGracePeriodWarning(userId, daysRemaining) {
  try {
    // Get user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      throw new Error(`Could not find user with ID ${userId}: ${error?.message || 'User not found'}`);
    }
    
    // Format grace period end date
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + daysRemaining);
    const formattedGracePeriodEnd = gracePeriodEnd.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Prepare email content
    const subject = `Important: Your ReplyRocket Subscription Grace Period Ends in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://replyrocket.io/logo.png" alt="ReplyRocket Logo" style="max-width: 200px;">
        </div>
        
        <h2 style="color: #333; text-align: center;">Grace Period Ending Soon</h2>
        
        <p>Hello,</p>
        
        <p>This is a reminder that your ReplyRocket ${user.subscription_tier} subscription grace period is ending in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong> on ${formattedGracePeriodEnd}.</p>
        
        <p>If we're unable to process your payment by then, your account will be downgraded to the free plan, which includes limited features and only 25 responses per month.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription" style="background-color: #4A90E2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Update Payment Method</a>
        </div>
        
        <p>If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.</p>
        
        <p>Thank you for using ReplyRocket!</p>
        
        <p>Best regards,<br>The ReplyRocket Team</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777; text-align: center;">
          <p>ReplyRocket.io &bull; Your Business Email Assistant</p>
          <p>If you have questions, please contact support@replyrocket.io</p>
        </div>
      </div>
    `;
    
    const text = `
      Your ReplyRocket Subscription Grace Period Ends in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}
      
      Hello,
      
      This is a reminder that your ReplyRocket ${user.subscription_tier} subscription grace period is ending in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} on ${formattedGracePeriodEnd}.
      
      If we're unable to process your payment by then, your account will be downgraded to the free plan, which includes limited features and only 25 responses per month.
      
      Visit ${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription to update your payment method.
      
      If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.
      
      Thank you for using ReplyRocket!
      
      Best regards,
      The ReplyRocket Team
      
      ------
      ReplyRocket.io • Your Business Email Assistant
      If you have questions, please contact support@replyrocket.io
    `;
    
    // Send the email
    return await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending grace period warning:', error);
    throw error;
  }
}

/**
 * Send a notification when the user is downgraded to the free tier
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Email send result
 */
async function sendDowngradeNotification(userId) {
  try {
    // Get user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      throw new Error(`Could not find user with ID ${userId}: ${error?.message || 'User not found'}`);
    }
    
    // Prepare email content
    const subject = 'Your ReplyRocket Account Has Been Downgraded';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://replyrocket.io/logo.png" alt="ReplyRocket Logo" style="max-width: 200px;">
        </div>
        
        <h2 style="color: #333; text-align: center;">Account Downgraded to Free Plan</h2>
        
        <p>Hello,</p>
        
        <p>We're writing to inform you that your ReplyRocket account has been downgraded to the Free plan due to continued payment issues with your subscription.</p>
        
        <p>With the Free plan, you now have access to:</p>
        
        <ul>
          <li>25 AI-generated email responses per month</li>
          <li>Basic email templates</li>
          <li>Standard response time</li>
        </ul>
        
        <p>To regain access to premium features like advanced templates, priority support, and increased usage limits, please update your payment information and resubscribe to your preferred plan.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription" style="background-color: #4A90E2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upgrade My Account</a>
        </div>
        
        <p>If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.</p>
        
        <p>Thank you for using ReplyRocket!</p>
        
        <p>Best regards,<br>The ReplyRocket Team</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777; text-align: center;">
          <p>ReplyRocket.io &bull; Your Business Email Assistant</p>
          <p>If you have questions, please contact support@replyrocket.io</p>
        </div>
      </div>
    `;
    
    const text = `
      Your ReplyRocket Account Has Been Downgraded
      
      Hello,
      
      We're writing to inform you that your ReplyRocket account has been downgraded to the Free plan due to continued payment issues with your subscription.
      
      With the Free plan, you now have access to:
      - 25 AI-generated email responses per month
      - Basic email templates
      - Standard response time
      
      To regain access to premium features like advanced templates, priority support, and increased usage limits, please update your payment information and resubscribe to your preferred plan.
      
      Visit ${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription to upgrade your account.
      
      If you need any assistance, please don't hesitate to contact our support team at support@replyrocket.io.
      
      Thank you for using ReplyRocket!
      
      Best regards,
      The ReplyRocket Team
      
      ------
      ReplyRocket.io • Your Business Email Assistant
      If you have questions, please contact support@replyrocket.io
    `;
    
    // Send the email
    return await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending downgrade notification:', error);
    throw error;
  }
}

/**
 * Send a trial expiration reminder email to users
 * @param {string} userId - User ID
 * @param {number} daysRemaining - Days remaining in trial period
 * @returns {Promise<Object>} - Email send result
 */
async function sendTrialExpirationReminder(userId, daysRemaining) {
  try {
    // Get user data from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name, last_name, subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      throw new Error(`Could not find user with ID ${userId}: ${error?.message || 'User not found'}`);
    }
    
    // Format trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + daysRemaining);
    const formattedTrialEndDate = trialEndDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Prepare email content
    const subject = `Your ReplyRocket Trial Ends in ${daysRemaining} Days`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://replyrocket.io/logo.png" alt="ReplyRocket Logo" style="max-width: 200px;">
        </div>
        
        <h2 style="color: #333; text-align: center;">Your Trial is Ending Soon</h2>
        
        <p>Hello${user.first_name ? ' ' + user.first_name : ''},</p>
        
        <p>We hope you've been enjoying your ReplyRocket trial! This is a friendly reminder that your trial period is coming to an end in <strong>${daysRemaining} days</strong> on <strong>${formattedTrialEndDate}</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>What happens when your trial ends?</strong></p>
          <p>Your account will automatically be converted to our free plan, which includes:</p>
          <ul>
            <li>25 AI-generated email responses per month</li>
            <li>Basic templates</li>
            <li>Standard response time</li>
          </ul>
        </div>
        
        <p>To keep enjoying all the premium features you've had access to during your trial, including advanced templates, priority response generation, and increased monthly limits, we invite you to upgrade to one of our paid plans.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription" style="background-color: #4A90E2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upgrade My Account</a>
        </div>
        
        <p>If you have any questions about our subscription plans or need assistance, please don't hesitate to reply to this email or contact our support team at support@replyrocket.io.</p>
        
        <p>Thank you for trying ReplyRocket!</p>
        
        <p>Best regards,<br>The ReplyRocket Team</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777; text-align: center;">
          <p>ReplyRocket.io &bull; Your Business Email Assistant</p>
          <p>If you have questions, please contact support@replyrocket.io</p>
        </div>
      </div>
    `;
    
    const text = `
      Your ReplyRocket Trial Ends in ${daysRemaining} Days
      
      Hello${user.first_name ? ' ' + user.first_name : ''},
      
      We hope you've been enjoying your ReplyRocket trial! This is a friendly reminder that your trial period is coming to an end in ${daysRemaining} days on ${formattedTrialEndDate}.
      
      What happens when your trial ends?
      Your account will automatically be converted to our free plan, which includes:
      - 25 AI-generated email responses per month
      - Basic templates
      - Standard response time
      
      To keep enjoying all the premium features you've had access to during your trial, including advanced templates, priority response generation, and increased monthly limits, we invite you to upgrade to one of our paid plans.
      
      Visit ${process.env.NEXT_PUBLIC_BASE_URL || 'https://replyrocket.io'}/subscription to upgrade your account.
      
      If you have any questions about our subscription plans or need assistance, please don't hesitate to reply to this email or contact our support team at support@replyrocket.io.
      
      Thank you for trying ReplyRocket!
      
      Best regards,
      The ReplyRocket Team
      
      ------
      ReplyRocket.io • Your Business Email Assistant
      If you have questions, please contact support@replyrocket.io
    `;
    
    // Send the email
    return await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('Error sending trial expiration reminder:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendPaymentFailureNotification,
  sendGracePeriodWarning,
  sendDowngradeNotification,
  sendTrialExpirationReminder
}; 