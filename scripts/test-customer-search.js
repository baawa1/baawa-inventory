/**
 * Test script for enhanced customer search functionality
 * This script tests the customer search API endpoints
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testCustomerSearch() {
  console.log('🧪 Testing Enhanced Customer Search Functionality\n');

  try {
    // Test 1: Search by phone number (7+ digits)
    console.log('📞 Test 1: Phone number search (7+ digits)');
    const phoneSearch = await fetch(`${BASE_URL}/api/pos/customers?search=08012345678`);
    const phoneResults = await phoneSearch.json();
    console.log(`   Results: ${phoneResults.length} customers found`);
    console.log(`   Status: ${phoneSearch.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 2: Search by email
    console.log('📧 Test 2: Email search');
    const emailSearch = await fetch(`${BASE_URL}/api/pos/customers?search=john.doe@example.com`);
    const emailResults = await emailSearch.json();
    console.log(`   Results: ${emailResults.length} customers found`);
    console.log(`   Status: ${emailSearch.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 3: Check uniqueness endpoint - phone
    console.log('🔍 Test 3: Check uniqueness - phone');
    const phoneCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '08012345678' }),
    });
    const phoneCheckResult = await phoneCheck.json();
    console.log(`   Exists: ${phoneCheckResult.exists}`);
    console.log(`   Message: ${phoneCheckResult.message}`);
    console.log(`   Status: ${phoneCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 4: Check uniqueness endpoint - email
    console.log('🔍 Test 4: Check uniqueness - email');
    const emailCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.doe@example.com' }),
    });
    const emailCheckResult = await emailCheck.json();
    console.log(`   Exists: ${emailCheckResult.exists}`);
    console.log(`   Message: ${emailCheckResult.message}`);
    console.log(`   Status: ${emailCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 5: Partial phone match
    console.log('🔍 Test 5: Partial phone match');
    const partialPhoneCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '080123' }),
    });
    const partialPhoneResult = await partialPhoneCheck.json();
    console.log(`   Has partial matches: ${partialPhoneResult.hasPartialMatches}`);
    console.log(`   Message: ${partialPhoneResult.message}`);
    console.log(`   Status: ${partialPhoneCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test 6: Partial email match
    console.log('🔍 Test 6: Partial email match');
    const partialEmailCheck = await fetch(`${BASE_URL}/api/pos/customers/check-unique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john' }),
    });
    const partialEmailResult = await partialEmailCheck.json();
    console.log(`   Has partial matches: ${partialEmailResult.hasPartialMatches}`);
    console.log(`   Message: ${partialEmailResult.message}`);
    console.log(`   Status: ${partialEmailCheck.ok ? '✅ PASS' : '❌ FAIL'}\n`);

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to check if we should search for phone
function shouldSearchPhone(phone) {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

// Helper function to check if we should search for email
function shouldSearchEmail(email) {
  return email.length >= 5 && email.includes('@');
}

// Test helper functions
console.log('🧪 Testing Helper Functions\n');

console.log('📞 Phone search triggers:');
console.log(`   "08012345678" -> ${shouldSearchPhone('08012345678')}`);
console.log(`   "080123" -> ${shouldSearchPhone('080123')}`);
console.log(`   "080" -> ${shouldSearchPhone('080')}`);
console.log(`   "080-123-4567" -> ${shouldSearchPhone('080-123-4567')}\n`);

console.log('📧 Email search triggers:');
console.log(`   "john@example.com" -> ${shouldSearchEmail('john@example.com')}`);
console.log(`   "john" -> ${shouldSearchEmail('john')}`);
console.log(`   "john@" -> ${shouldSearchEmail('john@')}`);
console.log(`   "john@example" -> ${shouldSearchEmail('john@example')}\n`);

// Run the main tests
testCustomerSearch(); 