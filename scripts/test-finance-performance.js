#!/usr/bin/env node

/**
 * Performance test script for finance API
 * Measures response times for the finance summary endpoint
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/finance/summary';
const NUM_REQUESTS = 10;

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          duration,
          data: data.length,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPerformanceTest() {
  console.log(`🚀 Starting performance test for: ${API_URL}`);
  console.log(`📊 Running ${NUM_REQUESTS} requests...\n`);
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < NUM_REQUESTS; i++) {
    try {
      const result = await makeRequest(API_URL);
      results.push(result);
      console.log(`✅ Request ${i + 1}: ${result.duration}ms (${result.statusCode})`);
    } catch (error) {
      errors.push(error);
      console.log(`❌ Request ${i + 1}: Failed - ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 Performance Summary:');
  console.log('=====================');
  
  if (results.length > 0) {
    const durations = results.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const sortedDurations = durations.sort((a, b) => a - b);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];
    
    console.log(`✅ Successful requests: ${results.length}/${NUM_REQUESTS}`);
    console.log(`⏱️  Average response time: ${avgDuration.toFixed(2)}ms`);
    console.log(`⚡ Fastest response: ${minDuration}ms`);
    console.log(`🐌 Slowest response: ${maxDuration}ms`);
    console.log(`📊 Median response time: ${medianDuration}ms`);
    
    // Performance rating
    if (avgDuration < 500) {
      console.log(`🎉 Performance: EXCELLENT (< 500ms)`);
    } else if (avgDuration < 1000) {
      console.log(`👍 Performance: GOOD (< 1s)`);
    } else if (avgDuration < 2000) {
      console.log(`⚠️  Performance: ACCEPTABLE (< 2s)`);
    } else {
      console.log(`🚨 Performance: POOR (> 2s) - Needs optimization`);
    }
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ Failed requests: ${errors.length}/${NUM_REQUESTS}`);
    errors.forEach((error, index) => {
      console.log(`   Error ${index + 1}: ${error.message}`);
    });
  }
  
  console.log('\n🏁 Performance test completed!');
}

// Run the test
runPerformanceTest().catch(console.error);
