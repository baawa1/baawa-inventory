#!/usr/bin/env node

/**
 * Production Customer Import Script
 * 
 * This script safely imports WooCommerce customers to production database.
 * It includes safety checks and environment validation.
 * 
 * Usage: 
 *   # First, set up your environment
 *   cp scripts/setup-production-env.example .env.production
 *   # Edit .env.production with your actual values
 *   
 *   # Then run the import
 *   NODE_ENV=production node scripts/import-customers-production.js [--dry-run] [--force]
 * 
 * Options:
 * --dry-run: Show what would be imported without actually importing
 * --force: Skip duplicate checks and force import (use with caution)
 */

const fs = require('fs');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, '..', envFile);

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`🔧 Loaded environment from ${envFile}`);
} else {
  console.error(`❌ Environment file not found: ${envPath}`);
  console.error('');
  console.error('📋 Setup Instructions:');
  console.error('   1. Copy: cp scripts/setup-production-env.example .env.production');
  console.error('   2. Edit .env.production with your actual database credentials');
  console.error('   3. Run: NODE_ENV=production node scripts/import-customers-production.js');
  process.exit(1);
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(envVar => console.error(`   ${envVar}`));
  console.error('');
  console.error('💡 Check your .env.production file');
  process.exit(1);
}

// Additional safety checks for production
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  PRODUCTION MODE DETECTED');
  console.log('');
  
  // Check if this is actually a production database
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log('💡 Database appears to be local, proceeding...');
  } else {
    console.log('🚨 PRODUCTION DATABASE DETECTED');
    console.log('   Database:', dbUrl.replace(/:[^:]*@/, ':***@'));
    console.log('');
    
    // Force confirmation for production database
    const args = process.argv.slice(2);
    if (!args.includes('--confirm-production')) {
      console.error('❌ Production database import requires explicit confirmation');
      console.error('');
      console.error('📋 To proceed with production database:');
      console.error('   NODE_ENV=production node scripts/import-customers-production.js --confirm-production [other-options]');
      console.error('');
      console.error('⚠️  This will modify your production database!');
      process.exit(1);
    }
    
    console.log('✅ Production confirmation received, proceeding...');
  }
}

// Import and run the main import function
const { importCustomers } = require('./import-woocommerce-customers');

async function runProductionImport() {
  try {
    console.log('🚀 Starting production customer import...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    
    await importCustomers();
    
  } catch (error) {
    console.error('💥 Production import failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Safety prompt for production
if (process.env.NODE_ENV === 'production') {
  console.log('⏳ Starting import in 3 seconds...');
  console.log('   Press Ctrl+C to cancel');
  console.log('');
  
  setTimeout(() => {
    runProductionImport();
  }, 3000);
} else {
  runProductionImport();
}
