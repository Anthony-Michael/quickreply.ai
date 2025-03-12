/**
 * Script to apply security policies to Supabase database
 * 
 * Since we don't have direct API execution access, this script will:
 * 1. Create a summary of security policies to be applied
 * 2. Save the policies to a local file for manual application
 * 
 * Usage:
 * node scripts/apply-security-policies.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(chalk.red('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'));
  process.exit(1);
}

/**
 * Split SQL into statements and analyze them
 */
function analyzeStatements(sql) {
  // Split the SQL file into individual statements
  const statements = sql
    .replace(/--.*$/gm, '') // Remove comments
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
  
  console.log(chalk.blue(`Found ${statements.length} SQL statements to process`));
  
  const enableRlsStatements = [];
  const policyStatements = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.toUpperCase().includes('ENABLE ROW LEVEL SECURITY')) {
      enableRlsStatements.push({
        index: i + 1,
        statement,
        table: statement.match(/ALTER TABLE\s+([^\s]+)/i)?.[1] || 'unknown'
      });
    } else if (statement.toUpperCase().includes('CREATE POLICY')) {
      policyStatements.push({
        index: i + 1,
        statement,
        name: statement.match(/CREATE POLICY\s+"([^"]+)"/i)?.[1] || 'unknown',
        table: statement.match(/ON\s+([^\s]+)/i)?.[1] || 'unknown',
        type: statement.toUpperCase().includes('FOR SELECT') ? 'SELECT' :
              statement.toUpperCase().includes('FOR INSERT') ? 'INSERT' :
              statement.toUpperCase().includes('FOR UPDATE') ? 'UPDATE' :
              statement.toUpperCase().includes('FOR DELETE') ? 'DELETE' : 'UNKNOWN'
      });
    }
  }
  
  return { statements, enableRlsStatements, policyStatements };
}

/**
 * Generate SQL execution script for manual execution
 */
function generateExecutionScript(statements) {
  const scriptPath = path.join(process.cwd(), 'supabase-policy-execution.sql');
  
  // Add header with instructions
  let scriptContent = `-- Supabase Row Level Security Policy Execution Script
-- Generated: ${new Date().toISOString()}
--
-- INSTRUCTIONS:
-- 1. Log in to your Supabase dashboard: ${SUPABASE_URL}
-- 2. Go to the SQL Editor
-- 3. Copy and paste this entire script
-- 4. Execute the script
-- 5. Verify the policies were created successfully
--
-- Note: If any statements fail, you can comment them out and re-run the script

`;

  // Add each statement
  statements.forEach((statement, index) => {
    scriptContent += `-- Statement ${index + 1}\n${statement};\n\n`;
  });
  
  // Write to file
  fs.writeFileSync(scriptPath, scriptContent);
  
  return scriptPath;
}

/**
 * Main function to analyze and apply security policies
 */
async function applySecurityPolicies() {
  console.log(chalk.yellow('Analyzing Supabase security policies...'));
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'supabase-security-policies.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Analyze the statements
    const { statements, enableRlsStatements, policyStatements } = analyzeStatements(sql);
    
    // Print summary
    console.log(chalk.green(`\nSecurity Policy Summary:`));
    console.log(chalk.blue(`Total statements: ${statements.length}`));
    console.log(chalk.blue(`Enable RLS statements: ${enableRlsStatements.length}`));
    console.log(chalk.blue(`Policy creation statements: ${policyStatements.length}`));
    
    // Print tables that will have RLS enabled
    console.log(chalk.green('\nTables with RLS enabled:'));
    enableRlsStatements.forEach(({table}) => {
      console.log(`- ${table}`);
    });
    
    // Print policies by table
    console.log(chalk.green('\nPolicies by table:'));
    const tableMap = {};
    policyStatements.forEach((policy) => {
      if (!tableMap[policy.table]) {
        tableMap[policy.table] = [];
      }
      tableMap[policy.table].push(policy);
    });
    
    Object.keys(tableMap).forEach(table => {
      console.log(chalk.blue(`\nTable: ${table}`));
      tableMap[table].forEach(policy => {
        console.log(`- [${policy.type}] "${policy.name}"`);
      });
    });
    
    // Generate execution script
    const scriptPath = generateExecutionScript(statements);
    console.log(chalk.green(`\nExecution script generated: ${scriptPath}`));
    console.log(chalk.yellow(`\nPlease execute this script in the Supabase SQL Editor to apply your policies.`));
    
    console.log(chalk.green('\nSecurity policies analyzed successfully!'));
    console.log(chalk.yellow('Note: After applying the policies, verify them by running: node scripts/test-rls-policies.js'));
  } catch (error) {
    console.error(chalk.red('Failed to analyze security policies:'), error);
    process.exit(1);
  }
}

// Run the main function
applySecurityPolicies(); 