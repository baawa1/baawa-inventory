const axios = require('axios');

// Green API Configuration
const GREEN_API_CONFIG = {
  idInstance: process.env.GREEN_API_INSTANCE_ID,
  apiTokenInstance: process.env.GREEN_API_TOKEN,
  baseURL: 'https://api.green-api.com'
};

// Test phone number (your number)
const TEST_PHONE = '2347039894270'; // Remove the + and add country code

async function sendTestMessage() {
  try {
    console.log('🚀 Testing Green API WhatsApp connection...');
    console.log('📱 Sending test message to:', TEST_PHONE);
    
    const messageData = {
      chatId: `${TEST_PHONE}@c.us`,
      message: `🧪 Test message from Baawa POS System\n\nThis is a test message to verify Green API integration.\n\nTime: ${new Date().toLocaleString()}\n\nIf you receive this, Green API is working! ✅`
    };

    const response = await axios.post(
      `${GREEN_API_CONFIG.baseURL}/waInstance${GREEN_API_CONFIG.idInstance}/SendMessage/${GREEN_API_CONFIG.apiTokenInstance}`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('📊 Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    throw error;
  }
}

async function checkInstanceStatus() {
  try {
    console.log('🔍 Checking Green API instance status...');
    
    const response = await axios.get(
      `${GREEN_API_CONFIG.baseURL}/waInstance${GREEN_API_CONFIG.idInstance}/getStateInstance/${GREEN_API_CONFIG.apiTokenInstance}`
    );

    console.log('📊 Instance Status:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error checking instance status:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    // Check if environment variables are set
    if (!GREEN_API_CONFIG.idInstance || !GREEN_API_CONFIG.apiTokenInstance) {
      console.error('❌ Missing Green API credentials!');
      console.log('Please set these environment variables:');
      console.log('GREEN_API_INSTANCE_ID=your_instance_id');
      console.log('GREEN_API_TOKEN=your_api_token');
      return;
    }

    // Check instance status first
    await checkInstanceStatus();
    
    // Send test message
    await sendTestMessage();
    
    console.log('\n🎉 Green API test completed successfully!');
    console.log('📱 Check your WhatsApp for the test message.');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { sendTestMessage, checkInstanceStatus };

