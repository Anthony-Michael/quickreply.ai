# Trial Expiration Management for QuickReply.ai

This document outlines how QuickReply.ai manages trial expirations, including the reminder email system and dashboard notifications.

## Overview

To provide a better user experience for trial users, QuickReply.ai:

1. **Displays a banner** on the dashboard showing the number of days remaining in the trial
2. **Sends reminder emails** 3 days before trial expiration
3. **Automatically converts** expired trials to the free plan

## Components

### 1. Dashboard Trial Expiration Banner

Located in `src/components/Dashboard.jsx`, the dashboard includes a prominent yellow banner that displays:
- The number of days remaining in the trial
- This banner is only shown to users with a `subscription_tier` of 'trial'

The banner is implemented as follows:

```jsx
{trialDaysRemaining !== null && (
  <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
    Trial Ends in {trialDaysRemaining} Days
  </div>
)}
```

### 2. Email Notification Service

Located in `pages/api/utils/email-service.js`, this service includes a function for sending trial expiration reminder emails:

- `sendTrialExpirationReminder(userId, daysRemaining)`: Sends a personalized email to users with information about their upcoming trial expiration

### 3. Trial Expiration Checker

Located in `pages/api/cron/check-trial-expirations.js`, this scheduled job:

- Identifies accounts with trials expiring in 3 days
- Sends personalized reminder emails via the email service
- Logs email events to the database for tracking purposes

## Implementation Details

### Required Environment Variables

```
# Email Service Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notifications@quickreply.ai
EMAIL_PASSWORD=your-secure-password
EMAIL_FROM=support@quickreply.ai

# Cron Job Security
CRON_SECRET=your-secure-secret
```

### Scheduled Job Configuration

Configure a cron job to call the trial expiration checker endpoint daily:

```
# Sample crontab or Vercel Cron configuration
0 9 * * * curl -X POST https://yourapp.com/api/cron/check-trial-expirations -H "Authorization: Bearer ${CRON_SECRET}"
```

For Vercel, add this to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-trial-expirations",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Testing the System

To test the trial expiration system:

1. **Create a test account** with a trial subscription
2. **Set the trial expiration date** to be 3 days in the future
3. **Manually trigger** the cron job to check if reminders are sent correctly
4. **Verify the dashboard** shows the correct number of days remaining

## Customization

### Email Template

The email template can be customized in `pages/api/utils/email-service.js`. Look for the `sendTrialExpirationReminder` function to modify the HTML and text versions of the email.

### Dashboard Notification

The dashboard notification style and wording can be modified in `src/components/Dashboard.jsx`. Look for the `trialDaysRemaining` condition to adjust the appearance and content of the banner.

## Troubleshooting

If users are not receiving trial expiration reminders:

1. Check the `error_logs` table for any errors related to `trial_reminder_error`
2. Verify that the user's subscription details are correctly set in the database
3. Ensure the cron job is running on schedule and is authorized correctly
4. Check email delivery logs in your email service provider 