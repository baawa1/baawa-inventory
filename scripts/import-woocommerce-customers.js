#!/usr/bin/env node

/**
 * WooCommerce Customer Import Script
 * 
 * This script imports customer data from the WooCommerce CSV export into the Prisma database.
 * It maps relevant fields and handles duplicates safely.
 * 
 * Usage: node scripts/import-woocommerce-customers.js [--dry-run] [--force]
 * 
 * Options:
 * --dry-run: Show what would be imported without actually importing
 * --force: Skip duplicate checks and force import (use with caution)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// CSV file path
const CSV_FILE = path.join(__dirname, '..', 'user-export-1-68967500b39fc.csv');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

/**
 * Parse CSV line handling quoted values properly
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Convert WooCommerce date to JavaScript Date
 */
function parseWooCommerceDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn(`Invalid date format: ${dateString}`);
    return null;
  }
}

/**
 * Convert Unix timestamp to JavaScript Date
 */
function parseUnixTimestamp(timestamp) {
  if (!timestamp || timestamp.trim() === '') return null;
  try {
    const date = new Date(parseInt(timestamp) * 1000);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn(`Invalid timestamp: ${timestamp}`);
    return null;
  }
}

/**
 * Clean and validate email
 */
function cleanEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : null;
}

/**
 * Clean and validate phone number
 */
function cleanPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + if followed by country code, keep reasonable length
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Ensure phone number is reasonable length (7-15 digits)
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return cleaned;
  }
  
  return null;
}

/**
 * Clean name fields
 */
function cleanName(name) {
  if (!name || typeof name !== 'string') return null;
  const cleaned = name.trim().replace(/[_\d]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 && cleaned.length <= 100 ? cleaned : null;
}

/**
 * Map WooCommerce customer data to Prisma User format
 */
function mapCustomerData(row, headers) {
  const data = {};
  
  // Create mapping from headers to data
  headers.forEach((header, index) => {
    data[header] = row[index] || '';
  });
  
  // Extract and clean required fields
  const email = cleanEmail(data.user_email);
  const firstName = cleanName(data.first_name);
  const lastName = cleanName(data.last_name);
  
  // Skip if essential fields are missing
  if (!email || !firstName || !lastName) {
    return null;
  }
  
  return {
    email,
    firstName,
    lastName,
    phone: cleanPhone(data.billing_phone),
    role: 'STAFF', // Import as STAFF role as per project requirements
    userStatus: 'APPROVED', // Pre-approve imported customers
    emailVerified: true, // Assume WooCommerce customers are verified
    emailVerifiedAt: new Date(),
    isActive: true,
    createdAt: parseWooCommerceDate(data.user_registered) || new Date(),
    lastActivity: parseUnixTimestamp(data.wc_last_active),
    password: null, // Users will need to reset their password
    emailNotifications: true,
    sessionNeedsRefresh: false,
    permissions: [], // Empty permissions array
  };
}

/**
 * Check for existing users by email
 */
async function checkForDuplicates(customers) {
  const emails = customers.map(c => c.email);
  const existingUsers = await prisma.user.findMany({
    where: {
      email: { in: emails }
    },
    select: { email: true, id: true }
  });
  
  const existingEmails = new Set(existingUsers.map(u => u.email));
  return {
    existingUsers: existingUsers,
    duplicates: customers.filter(c => existingEmails.has(c.email)),
    newCustomers: customers.filter(c => !existingEmails.has(c.email))
  };
}

/**
 * Main import function
 */
async function importCustomers() {
  try {
    console.log('🚀 Starting WooCommerce customer import...');
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
    console.log(`🔧 Force: ${isForce ? 'YES' : 'NO'}`);
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }
    
    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log(`📋 Found ${headers.length} columns in CSV`);
    
    // Parse data rows
    const customers = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);
        if (row.length !== headers.length) {
          console.warn(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
          continue;
        }
        
        const customerData = mapCustomerData(row, headers);
        if (customerData) {
          customers.push(customerData);
        } else {
          errors.push(`Row ${i + 1}: Missing required fields (email, firstName, or lastName)`);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully parsed ${customers.length} customers`);
    if (errors.length > 0) {
      console.log(`⚠️  Found ${errors.length} errors:`);
      errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }
    
    if (customers.length === 0) {
      console.log('❌ No valid customers found to import');
      return;
    }
    
    // Check for duplicates unless force mode
    let finalCustomers = customers;
    if (!isForce) {
      console.log('🔍 Checking for duplicate emails...');
      const { duplicates, newCustomers, existingUsers } = await checkForDuplicates(customers);
      
      if (duplicates.length > 0) {
        console.log(`⚠️  Found ${duplicates.length} customers with existing emails:`);
        duplicates.slice(0, 5).forEach(dup => console.log(`   ${dup.email}`));
        if (duplicates.length > 5) {
          console.log(`   ... and ${duplicates.length - 5} more duplicates`);
        }
        console.log('💡 Use --force to import duplicates (will skip them)');
      }
      
      finalCustomers = newCustomers;
      console.log(`📊 ${newCustomers.length} new customers to import`);
    }
    
    if (finalCustomers.length === 0) {
      console.log('✨ No new customers to import');
      return;
    }
    
    // Show sample of what will be imported
    console.log('\n📋 Sample customers to import:');
    finalCustomers.slice(0, 3).forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
    });
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No data was imported');
      console.log(`📊 Would import ${finalCustomers.length} customers`);
      return;
    }
    
    // Import customers in batches
    console.log(`\n💾 Importing ${finalCustomers.length} customers...`);
    const batchSize = 50;
    let imported = 0;
    let failed = 0;
    
    for (let i = 0; i < finalCustomers.length; i += batchSize) {
      const batch = finalCustomers.slice(i, i + batchSize);
      
      try {
        await prisma.user.createMany({
          data: batch,
          skipDuplicates: true
        });
        imported += batch.length;
        console.log(`   ✅ Imported batch ${Math.floor(i / batchSize) + 1} (${batch.length} customers)`);
      } catch (error) {
        failed += batch.length;
        console.error(`   ❌ Failed to import batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`   ✅ Successfully imported: ${imported} customers`);
    console.log(`   ❌ Failed to import: ${failed} customers`);
    
    if (imported > 0) {
      console.log('\n📝 Next steps:');
      console.log('   1. Imported customers will need to reset their passwords');
      console.log('   2. Review customer roles and permissions as needed');
      console.log('   3. Verify email notifications are working');
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importCustomers().catch(console.error);
}

module.exports = { importCustomers, mapCustomerData, cleanEmail, cleanPhone, cleanName };
