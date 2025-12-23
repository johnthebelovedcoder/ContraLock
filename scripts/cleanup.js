#!/usr/bin/env node

/**
 * Cleanup script for the ContraLock monorepo
 * This script helps identify and remove dead code and redundant files
 */

const fs = require('fs');
const path = require('path');

// Configuration for directories that should be empty or removed
const EMPTY_DIRECTORIES = [
  'packages/database',
  'packages/types', 
  'packages/ui',
  'apps/uploads'
];

// Configuration for duplicate/redundant files
const DUPLICATE_FILES = [
  { primary: 'check-users.js', duplicates: ['check_users.js'] },
  { primary: 'create-test-users.js', duplicates: ['create-test-user.js'] }
];

// Configuration for user management scripts that might be consolidated
const USER_MANAGEMENT_SCRIPTS = [
  'create-admin-user.js',
  'create-custom-user.js', 
  'create-freelancer-user.js',
  'create-more-test-users.js',
  'create-new-test-users.js',
  'create-test-user-fixed.js',
  'create-test-user-sqlite.js',
  'create-user-registry-flow.js',
  'register-test-user.js',
  'update-user-registry-flow.js'
];

// Configuration for test/debug scripts that might be obsolete
const TEST_DEBUG_SCRIPTS = [
  'debug-password.js',
  'delete-test-users.js',
  'detailed-user-check.js', 
  'fix-user-profile.js',
  'list-users.js',
  'simulate-auth-login.js',
  'test-all-passwords.js',
  'test-database.js',
  'test-features.js',
  'test-login-fix.js',
  'test-login-flow.js',
  'test-login.js',
  'test-server.js',
  'update-freelancer-password.js',
  'verify-user.js'
];

function checkEmptyDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`✓ Directory ${dirPath} does not exist`);
    return true;
  }

  const items = fs.readdirSync(dirPath);
  if (items.length === 0) {
    console.log(`✓ Directory ${dirPath} is empty as expected`);
    return true;
  } else {
    console.log(`! Directory ${dirPath} is not empty. Contents:`, items);
    return false;
  }
}

function checkDuplicateFile(primary, duplicates) {
  const primaryExists = fs.existsSync(primary);
  const results = [];
  
  for (const duplicate of duplicates) {
    const duplicateExists = fs.existsSync(duplicate);
    results.push({ file: duplicate, exists: duplicateExists });
    
    if (duplicateExists) {
      console.log(`! Duplicate file found: ${duplicate} (primary: ${primary})`);
    }
  }
  
  return { primaryExists, duplicates: results };
}

function runAnalysis() {
  console.log('🔍 Starting ContraLock monorepo cleanup analysis...\n');
  
  console.log('📋 Checking empty directories...');
  let allEmpty = true;
  for (const dir of EMPTY_DIRECTORIES) {
    if (!checkEmptyDirectory(dir)) {
      allEmpty = false;
    }
  }
  
  console.log('\n📋 Checking duplicate files...');
  for (const { primary, duplicates } of DUPLICATE_FILES) {
    checkDuplicateFile(primary, duplicates);
  }
  
  console.log('\n📋 User management scripts found:');
  for (const script of USER_MANAGEMENT_SCRIPTS) {
    if (fs.existsSync(script)) {
      console.log(`  - ${script}`);
    }
  }
  
  console.log('\n📋 Test/debug scripts found:');
  for (const script of TEST_DEBUG_SCRIPTS) {
    if (fs.existsSync(script)) {
      console.log(`  - ${script}`);
    }
  }
  
  console.log('\n✅ Analysis complete!');
  console.log('Review the findings above before proceeding with cleanup.');
  console.log('Use caution when removing files that may be referenced elsewhere.');
}

if (require.main === module) {
  runAnalysis();
}