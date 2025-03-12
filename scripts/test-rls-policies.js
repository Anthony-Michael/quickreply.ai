/**
 * Script to test Row Level Security policies on Supabase
 * 
 * This script validates your environment setup and provides guidance
 * for testing RLS policies in your Supabase database.
 * 
 * Usage:
 * node scripts/test-rls-policies.js
 */

import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Check for required environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Function to read and summarize the security policies
function summarizePolicies() {
  try {
    const policyPath = path.join(process.cwd(), 'supabase-security-policies.sql');
    const policyContent = fs.readFileSync(policyPath, 'utf8');
    
    // Count policies by type
    const enableRlsCount = (policyContent.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
    const createPolicyCount = (policyContent.match(/CREATE POLICY/g) || []).length;
    const selectPolicyCount = (policyContent.match(/FOR SELECT/g) || []).length;
    const insertPolicyCount = (policyContent.match(/FOR INSERT/g) || []).length;
    const updatePolicyCount = (policyContent.match(/FOR UPDATE/g) || []).length;
    const deletePolicyCount = (policyContent.match(/FOR DELETE/g) || []).length;
    
    return {
      enableRlsCount,
      createPolicyCount,
      selectPolicyCount,
      insertPolicyCount,
      updatePolicyCount,
      deletePolicyCount,
      tables: [
        'profiles',
        'email_history',
        'email_templates',
        'subscription_events',
        'usage_analytics'
      ]
    };
  } catch (error) {
    console.error(chalk.red('Error reading policy file:'), error);
    return null;
  }
}

/**
 * Main function to check environment and display test instructions
 */
function checkEnvironmentAndInstruct() {
  console.log(chalk.yellow('Row Level Security (RLS) Policy Test Setup\n'));
  
  // Check environment variables
  let envVarsOk = true;
  
  if (!SUPABASE_URL) {
    console.log(chalk.red('❌ NEXT_PUBLIC_SUPABASE_URL is not set'));
    envVarsOk = false;
  } else {
    console.log(chalk.green(`✓ NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}`));
  }
  
  if (!SUPABASE_ANON_KEY) {
    console.log(chalk.red('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'));
    envVarsOk = false;
  } else {
    console.log(chalk.green(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 10)}...`));
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    console.log(chalk.red('❌ SUPABASE_SERVICE_ROLE_KEY is not set'));
    envVarsOk = false;
  } else {
    console.log(chalk.green(`✓ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY.substring(0, 10)}...`));
  }
  
  // Check if SQL policy file exists
  const policyPath = path.join(process.cwd(), 'supabase-security-policies.sql');
  let policiesExist = false;
  
  if (fs.existsSync(policyPath)) {
    console.log(chalk.green(`✓ Security policies file found: ${policyPath}`));
    policiesExist = true;
  } else {
    console.log(chalk.red(`❌ Security policies file not found: ${policyPath}`));
  }
  
  // Summarize policies if they exist
  if (policiesExist) {
    const summary = summarizePolicies();
    
    if (summary) {
      console.log(chalk.yellow('\nSecurity Policy Summary:'));
      console.log(chalk.blue(`Tables with RLS enabled: ${summary.enableRlsCount}`));
      console.log(chalk.blue(`Total policies defined: ${summary.createPolicyCount}`));
      console.log(chalk.blue(`  - SELECT policies: ${summary.selectPolicyCount}`));
      console.log(chalk.blue(`  - INSERT policies: ${summary.insertPolicyCount}`));
      console.log(chalk.blue(`  - UPDATE policies: ${summary.updatePolicyCount}`));
      console.log(chalk.blue(`  - DELETE policies: ${summary.deletePolicyCount}`));
      
      console.log(chalk.yellow('\nTables to be tested:'));
      summary.tables.forEach(table => {
        console.log(`- ${table}`);
      });
    }
  }
  
  // Display instructions for testing RLS policies
  console.log(chalk.yellow('\nTo test your RLS policies:'));
  console.log(chalk.white('\n1. First, make sure you have applied the policies to your database:'));
  console.log('   - Log in to your Supabase dashboard');
  console.log('   - Go to the SQL Editor');
  console.log('   - Execute the SQL from supabase-security-policies.sql');
  
  console.log(chalk.white('\n2. You can manually test the policies by:'));
  console.log('   - Creating two test users in the Supabase Auth section');
  console.log('   - Inserting test data for each user');
  console.log('   - Using the Supabase client to query data as each user');
  console.log('   - Verifying that users can only access their own data');
  
  // Display example code for testing
  console.log(chalk.yellow('\nExample testing code:'));
  console.log(chalk.white(`
// Initialize Supabase clients
import { createClient } from '@supabase/supabase-js';

// Admin client (bypasses RLS)
const adminClient = createClient(
  '${SUPABASE_URL || 'your-supabase-url'}',
  '${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : 'your-service-role-key'}'
);

// User client (subject to RLS)
const userClient = createClient(
  '${SUPABASE_URL || 'your-supabase-url'}',
  '${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'your-anon-key'}'
);

// Test steps:
// 1. Create test users
// 2. Sign in as user 1
// 3. Try to access user 1's data (should succeed)
// 4. Try to access user 2's data (should fail)
// 5. Repeat with user 2
`));

  if (!envVarsOk) {
    console.log(chalk.red('\n❌ Please set all required environment variables before testing.'));
  } else {
    console.log(chalk.green('\n✓ Environment is properly configured for testing.'));
  }
  
  console.log(chalk.yellow('\nFor detailed testing, consider implementing the full test script or using the Supabase Dashboard to verify your policies.'));
}

// Run the checks and display instructions
checkEnvironmentAndInstruct(); 