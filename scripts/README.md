# Database Security Scripts

This directory contains scripts for managing and testing database security policies in the QuickReply.ai application.

## Overview

Proper database security is critical for our application. These scripts help:

1. Apply Row Level Security (RLS) policies to the Supabase database
2. Test that the policies are working correctly
3. Ensure users can only access their own data

## Available Scripts

### `apply-security-policies.js`

This script applies the security policies defined in `supabase-security-policies.sql` to your Supabase database.

**Usage:**
```bash
node scripts/apply-security-policies.js
```

The script will:
1. Read the SQL file at `supabase-security-policies.sql`
2. Execute each SQL statement using the Supabase admin API
3. Log the results of each execution

### `test-rls-policies.js`

This script tests that the Row Level Security policies are working correctly by creating test users and attempting various operations.

**Usage:**
```bash
node scripts/test-rls-policies.js
```

The script will:
1. Create two test users
2. Add test data for each user
3. Sign in as one user and attempt to:
   - Read their own data (should succeed)
   - Read another user's data (should fail)
   - Update their own data (should succeed)
   - Update another user's data (should fail)
4. Clean up all test data and users when done

## Required Environment Variables

Both scripts require the following environment variables to be set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The anonymous client API key
- `SUPABASE_SERVICE_ROLE_KEY` - The service role key (keep this secret)

## Security Workflow

When making changes to the database schema or security policies:

1. Update the schema in `supabase-schema.sql`
2. Update the security policies in `supabase-security-policies.sql`
3. Run `node scripts/apply-security-policies.js` to apply the changes
4. Run `node scripts/test-rls-policies.js` to verify that the policies work correctly
5. If any tests fail, review and fix the policies, then repeat steps 3-4

## Best Practices

- **Never commit the service role key** to version control
- **Always test policy changes** before deploying to production
- **Add new tables to the test script** when they are created
- **Verify both read and write access** in your tests

## Troubleshooting

If the tests fail, check:

1. That RLS is enabled on all tables
2. That the policies use the correct syntax (`auth.uid()` to get the current user ID)
3. That the policies cover all operations (SELECT, INSERT, UPDATE, DELETE)
4. That the environment variables are set correctly

For more details, see the [Database Security](../docs/DATABASE_SECURITY.md) documentation. 