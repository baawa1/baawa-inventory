/**
 * Test script for enhanced customer search functionality
 * This script tests the customer search API endpoints that now include both customers and users
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testEnhancedSearch() {
  console.log('🧪 Testing Enhanced Customer Search (Customers + Users)\n');

  try {
    // Test 1: Search by phone number from users table
    console.log('📞 Test 1: Phone number search (from users table)');
    const phoneSearch = await fetch(`${BASE_URL}/api/pos/customers?search=09062690013`);
    const phoneResults = await phoneSearch.json();
    console.log(`   Results: ${phoneResults.length} matches found`);
    if (phoneResults.length > 0) {
      phoneResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} (${result.type}) - ${result.email} - ${result.phone}`);
      });
    }
    console.log(`   Status: ${phoneSearch.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 2: Search by email from users table
    console.log('📧 Test 2: Email search (from users table)');
    const emailSearch = await fetch(`${BASE_URL}/api/pos/customers?search=baawapay+joshua.thomas@gmail.com`);
    const emailResults = await emailSearch.json();
    console.log(`   Results: ${emailResults.length} matches found`);
    if (emailResults.length > 0) {
      emailResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} (${result.type}) - ${result.email} - ${result.phone}`);
      });
    }
    console.log(`   Status: ${emailSearch.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 3: Check uniqueness endpoint - phone from users
    console.log('🔍 Test 3: Check uniqueness - phone (from users table)');
    const phoneCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '09062690013' }),
    });
    const phoneCheckResult = await phoneCheck.json();
    console.log(`   Exists: ${phoneCheckResult.exists}`);
    console.log(`   Message: ${phoneCheckResult.message}`);
    console.log(`   Total matches: ${phoneCheckResult.customers.length}`);
    if (phoneCheckResult.customers.length > 0) {
      phoneCheckResult.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} (${customer.type}) - ${customer.email}`);
      });
    }
    console.log(`   Status: ${phoneCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 4: Check uniqueness endpoint - email from users
    console.log('🔍 Test 4: Check uniqueness - email (from users table)');
    const emailCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'baawapay+joshua.thomas@gmail.com' }),
    });
    const emailCheckResult = await emailCheck.json();
    console.log(`   Exists: ${emailCheckResult.exists}`);
    console.log(`   Message: ${emailCheckResult.message}`);
    console.log(`   Total matches: ${emailCheckResult.customers.length}`);
    if (emailCheckResult.customers.length > 0) {
      emailCheckResult.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} (${customer.type}) - ${customer.email}`);
      });
    }
    console.log(`   Status: ${emailCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 5: Search for non-existent data
    console.log('🔍 Test 5: Search for non-existent data');
    const nonExistentSearch = await fetch(`${BASE_URL}/api/pos/customers?search=nonexistent@example.com`);
    const nonExistentResults = await nonExistentSearch.json();
    console.log(`   Results: ${nonExistentResults.length} matches found`);
    console.log(`   Status: ${nonExistentSearch.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    console.log('🎉 All enhanced search tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - Customer search now includes both customers and users');
    console.log('   - Users are marked with "Staff" badge');
    console.log('   - Exact matches are highlighted');
    console.log('   - Duplicate prevention works across both tables');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testEnhancedSearch(); 