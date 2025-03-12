# Payment Failure Handling System for ReplyRocket.io

This document outlines how ReplyRocket.io manages payment failures, including the grace period implementation, email notifications, and account downgrade process.

## Overview

When a customer's subscription payment fails, ReplyRocket.io employs a user-friendly approach that:

1. **Maintains service access** during a 14-day grace period
2. **Proactively notifies customers** about the payment issue
3. **Sends reminders** as the grace period nears expiration
4. **Gracefully downgrades** to a free tier if the payment issue isn't resolved

## Architecture Components

The payment failure handling system consists of several components:

### 1. Database Schema Extensions

The `profiles` table includes fields to track payment status:

- `payment_status`: Current payment status (active, past_due, in_grace_period, canceled)
- `grace_period_end_date`: Timestamp when the grace period expires
- `payment_failure_count`: Number of consecutive payment failures
- `last_payment_failure_date`: Date of the most recent payment failure

### 2. Stripe Webhook Handler

Located in `pages/api/webhooks/stripe.js`, the webhook handler processes Stripe events:

- `invoice.payment_failed`: Triggers the grace period and sends notifications
- `invoice.payment_succeeded`: Clears grace period and resets payment status
- `customer.subscription.updated`: Updates subscription and payment status
- `customer.subscription.deleted`: Downgrades to free tier

### 3. Email Notification Service

Located in `pages/api/utils/email-service.js`, this service sends:

- Payment failure notifications
- Grace period reminder emails
- Account downgrade notifications

### 4. Grace Period Checker

Located in `pages/api/cron/check-grace-periods.js`, this scheduled job:

- Identifies accounts with expiring grace periods
- Sends reminder emails at 7, 3, and 1 days before expiration
- Automatically downgrades accounts when grace periods expire

## Payment Failure Workflow

1. **Initial Payment Failure**
   - Stripe attempts to charge the customer's card and fails
   - Stripe sends an `invoice.payment_failed` webhook event
   - Our webhook handler:
     - Sets the account to `in_grace_period` status
     - Calculates grace period end date (14 days from current date)
     - Increments the payment failure counter
     - Sends a payment failure notification email

2. **Grace Period**
   - The customer retains full access to their subscription tier
   - Stripe automatically retries the payment (based on Stripe settings)
   - Our system sends reminder emails at 7, 3, and 1 days before expiration

3. **Resolution Scenarios**

   a. **Customer Updates Payment Method**
      - Customer updates their payment information
      - Next Stripe payment attempt succeeds
      - Stripe sends `invoice.payment_succeeded` webhook
      - Our webhook handler:
        - Resets the account to `active` status
        - Clears grace period end date and failure counters

   b. **Grace Period Expires**
      - The scheduled job identifies the expired grace period
      - System downgrades the account to the free tier
      - System sends a downgrade notification email
      - Account retains data but has limited features/limits

## Email Templates

### 1. Payment Failure Notification

Sent immediately when a payment fails. Contains:
- Details about the failed payment
- Next automatic retry date
- Grace period expiration date
- Instructions for updating payment information
- Link to subscription management page

### 2. Grace Period Reminder

Sent at 7, 3, and 1 days before grace period expiration. Contains:
- Days remaining in grace period
- Consequences of expiration (downgrade to free tier)
- Instructions for updating payment information
- Link to subscription management page

### 3. Account Downgrade Notification

Sent when an account is downgraded after grace period expiration. Contains:
- Confirmation of downgrade to free tier
- Features and limitations of the free tier
- Instructions for upgrading again
- Link to subscription management page

## Implementation Details

### Database Migration

The migration in `migrations/subscription-grace-period.sql` adds:
- New columns to the `profiles` table
- The `email_notifications` table
- Required indexes for performance

### Required Environment Variables

```
# Email Service Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notifications@replyrocket.io
EMAIL_PASSWORD=your-secure-password
EMAIL_FROM=support@replyrocket.io

# Cron Job Security
CRON_SECRET=your-secure-secret
```

### Scheduled Job Configuration

Configure a cron job to call the grace period checker endpoint daily:

```
# Sample crontab or Vercel Cron configuration
0 0 * * * curl -X POST https://replyrocket.io/api/cron/check-grace-periods -H "Authorization: Bearer ${CRON_SECRET}"
```

## Testing the System

Test scenarios:

1. **Simulating a Failed Payment**
   - Stripe Dashboard > Customers > [Customer] > Update payment method to test card 4000 0000 0000 0341
   - Manually trigger an invoice collection

2. **Simulating Payment Recovery**
   - Update customer's payment method to a valid card during grace period
   - Verify account status is restored

3. **Simulating Grace Period Expiration**
   - Set a grace period end date to the past
   - Manually trigger the scheduled job
   - Verify downgrade occurs correctly

## Monitoring and Analytics

Key metrics to monitor:

- Payment failure rate
- Grace period recovery rate
- Average time to payment resolution
- Email open and click-through rates

## Future Improvements

Potential enhancements:

1. Implement in-app notifications for payment failures
2. Add SMS notifications for urgent payment reminders
3. Provide one-click temporary extension option for trusted customers
4. Implement payment retry customization for different customer segments

## Troubleshooting

Common issues and solutions:

1. **Missing webhook events**
   - Verify Stripe webhook configuration
   - Check server logs for signature verification errors

2. **Emails not being sent**
   - Confirm email service credentials are correct
   - Check spam/junk filters for test emails

3. **Grace period not properly tracking**
   - Ensure database schema has been properly migrated
   - Verify timezone handling in date calculations 