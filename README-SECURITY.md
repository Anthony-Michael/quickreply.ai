# Supabase Security Enhancement Guide

This guide will help you implement and verify Row Level Security (RLS) policies for your ReplyRocket.io Supabase database.

## Overview

The provided scripts and SQL files will:

1. **Add comprehensive Row Level Security (RLS) policies** to all database tables
2. **Create missing tables** for error and API request logging if they don't exist
3. **Test all security policies** to ensure they're correctly enforced
4. **Document the security architecture** for future reference

## Getting Started

### Prerequisites

- Node.js 14+ installed
- Supabase project with service role key
- Valid `.env` file with the following variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Installation

1. Install required packages:

```bash
npm install dotenv node-fetch @supabase/supabase-js
```

2. Make the scripts executable:

```bash
chmod +x scripts/apply-security-policies.js
chmod +x scripts/test-rls-policies.js
```

## Usage

### Step 1: Apply Security Policies

Run the following command to apply all security policies to your database:

```bash
node scripts/apply-security-policies.js
```

This script will:
- Read the SQL from `supabase-security-policies.sql`
- Apply each statement to your database
- Report success or failure for each statement

### Step 2: Verify Security Policies

Run the test script to verify that all security policies are working as expected:

```bash
node scripts/test-rls-policies.js
```

This script will:
- Create two test users
- Add test data for each user
- Attempt various operations to test data isolation
- Verify that users can only access and modify their own data
- Clean up all test data when finished

### Step 3: Review Documentation

Review the `docs/DATABASE_SECURITY.md` file for detailed information about:

- Security architecture overview
- Row Level Security policies for each table
- Authentication flow
- Best practices for maintaining security

## Security Policies Included

The following tables will be secured with RLS policies:

1. **profiles** - User profile data
2. **email_history** - Email generation history
3. **email_templates** - Saved email templates
4. **usage_analytics** - Usage statistics
5. **subscription_events** - Subscription-related events
6. **error_logs** - Error tracking (created if missing)
7. **api_request_logs** - API request tracking (created if missing)

Each table will have appropriate policies to ensure:

- Users can only access their own data
- Users can only modify their own data
- Service roles can perform necessary operations

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Verify your `SUPABASE_SERVICE_ROLE_KEY` has the necessary permissions
   - Ensure you're using the service role key, not the anon key

2. **SQL Execution Errors**
   - Check the SQL statement that failed
   - Some statements may fail if objects already exist (policies, tables)
   - Error details will be logged to the console

3. **Authentication Failures**
   - Verify your environment variables are correct
   - Check that your Supabase project is active

### Support

For any issues or questions, please:

1. Review the `docs/DATABASE_SECURITY.md` file
2. Check error messages in the console output
3. Consult the Supabase documentation on RLS: https://supabase.com/docs/guides/auth/row-level-security

## Contributing

If you find any issues or have suggestions for improvement, please submit an issue or pull request. 