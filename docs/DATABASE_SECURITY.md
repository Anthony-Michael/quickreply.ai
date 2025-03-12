# Database Security in ReplyRocket.io

This document explains the database security measures implemented in the ReplyRocket.io application, with a focus on Supabase Row Level Security (RLS) policies.

## Overview

ReplyRocket.io uses Supabase as its database and authentication provider. To ensure secure data access, we've implemented comprehensive Row Level Security (RLS) policies that limit data access based on user authentication status and user ID.

## Row Level Security Principles

Our security implementation follows these key principles:

1. **Users can only access their own data** - Each user can only read, update, or delete their own data. This applies to all tables in the database.

2. **Server-side operations bypass RLS when necessary** - For operations that need to access data across users (such as admin functions or analytics), we use server-side API routes with the Service Role key.

3. **Default deny** - By default, access to tables is denied unless explicitly granted by a policy.

4. **Principle of least privilege** - Each policy grants the minimum permissions needed to function.

## Tables and Security Policies

### `profiles` Table

This table stores user profile information that extends the default Supabase auth.users table.

| Policy | Access Type | Description |
|--------|-------------|-------------|
| Users can view their own profile | SELECT | Users can only read their own profile data |
| Users can update their own profile | UPDATE | Users can only update their own profile data |
| Users cannot insert profiles directly | INSERT | Profile creation is handled by a trigger when a user signs up |
| Users cannot delete profiles | DELETE | Profiles are deleted automatically when the user is deleted through auth |

### `email_history` Table

This table stores the history of emails processed by the application.

| Policy | Access Type | Description |
|--------|-------------|-------------|
| Users can view their own email history | SELECT | Users can only read their own email history |
| Users can create their own email history | INSERT | Users can only create email history records for themselves |
| Users can update their own email history | UPDATE | Users can only update their own email history records |
| Users can delete their own email history | DELETE | Users can only delete their own email history records |

### `email_templates` Table

This table stores email templates created by users.

| Policy | Access Type | Description |
|--------|-------------|-------------|
| Users can view their own email templates | SELECT | Users can only read their own templates |
| Users can create their own email templates | INSERT | Users can only create templates for themselves |
| Users can update their own email templates | UPDATE | Users can only update their own templates |
| Users can delete their own email templates | DELETE | Users can only delete their own templates |

### `subscription_events` Table

This table records subscription-related events like upgrades, downgrades, and renewals.

| Policy | Access Type | Description |
|--------|-------------|-------------|
| Users can view their own subscription events | SELECT | Users can only read their own subscription events |
| Users cannot insert subscription events | INSERT | Insert operations are restricted to server-side code |
| Users cannot update subscription events | UPDATE | Update operations are not allowed |
| Users cannot delete subscription events | DELETE | Delete operations are not allowed |

### `usage_analytics` Table

This table stores usage analytics data for reporting.

| Policy | Access Type | Description |
|--------|-------------|-------------|
| Users can view their own analytics | SELECT | Users can only read their own analytics data |
| Users cannot insert analytics | INSERT | Insert operations are restricted to server-side code |
| Users cannot update analytics | UPDATE | Update operations are not allowed |
| Users cannot delete analytics | DELETE | Delete operations are not allowed |

## Server-Side Access Patterns

When server-side operations need to bypass RLS (e.g., for admin functions, webhook handling, or cross-user operations), we use the Supabase Service Role key via the `supabaseAdmin` client in `/pages/api/utils/supabase-admin.js`.

This approach ensures:

1. The high-privilege Service Role key never appears in client-side code
2. Each API route properly authenticates requests before using the admin client
3. Operations performed with the admin client are logged and monitored

Example usage in an API route:

```javascript
// Import the admin client
import { supabaseAdmin, authenticateRequest } from './utils/supabase-admin';

export default async function handler(req, res) {
  // First authenticate the incoming request
  const { user, error } = await authenticateRequest(req);
  
  if (error) {
    return res.status(401).json({ error });
  }
  
  // Now we can use the admin client to perform operations
  const { data, error: dbError } = await supabaseAdmin
    .from('some_table')
    .select('*')
    .eq('user_id', user.id);
    
  // Handle results and return response
  // ...
}
```

## Validating Policies

To verify that RLS policies are correctly implemented, run the test script:

```bash
node scripts/test-rls-policies.js
```

This script creates test users and attempts various operations to ensure that security policies are preventing unauthorized access.

## Best Practices for Developers

When developing features that interact with the database:

1. **Always test with RLS in mind** - Ensure that your feature works with RLS enabled and that users can only access their own data.

2. **Use server-side operations sparingly** - Only use the admin client when absolutely necessary.

3. **Validate input on the server** - Never trust client-side validation alone.

4. **Check permissions before operations** - Always verify that a user has permission to perform an operation before attempting it.

5. **Implement proper error handling** - Return appropriate error codes and messages when access is denied.

6. **Test policy changes thoroughly** - Whenever a policy is modified, use the test script to verify that security is maintained.

## Security Workflow for Schema Changes

When making schema changes:

1. Update the schema in `supabase-schema.sql`
2. Add appropriate RLS policies in `supabase-security-policies.sql`
3. Apply the changes using the provided scripts
4. Run the test script to verify the policies are working correctly

By following this documentation, developers can ensure that data in the ReplyRocket.io application remains secure and properly isolated between users. 