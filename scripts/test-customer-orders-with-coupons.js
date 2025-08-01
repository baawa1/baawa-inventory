const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testCustomerOrdersWithCoupons() {
  try {
    console.log('🧪 Testing Customer Orders API with Coupons...\n');

    // Test with a customer that has orders with coupons
    const customerEmail = 'baawapay+sarah.ramirez@gmail.com';
    
    console.log(`📧 Testing orders for customer: ${customerEmail}`);

    const url = `http://localhost:3000/api/pos/analytics/customers/${encodeURIComponent(customerEmail)}/orders`;
    const response = await makeRequest(url);
    
    if (response.status !== 200) {
      console.error(`❌ API request failed: ${response.status}`);
      return;
    }

    const data = response.data;
    
    if (!data.success) {
      console.error('❌ API returned error:', data.error);
      return;
    }

    console.log(`✅ Found ${data.data.length} orders for customer\n`);

    // Check if any orders have items with coupons
    const ordersWithCoupons = data.data.filter(order => 
      order.items.some(item => item.coupon)
    );

    console.log(`🎫 Orders with coupons: ${ordersWithCoupons.length}`);

    if (ordersWithCoupons.length > 0) {
      console.log('\n📋 Sample order with coupons:');
      const order = ordersWithCoupons[0];
      console.log(`Transaction: ${order.transactionNumber}`);
      console.log(`Date: ${new Date(order.timestamp).toLocaleString()}`);
      console.log(`Total: ₦${order.total.toLocaleString()}`);
      console.log(`Discount: ₦${order.discount.toLocaleString()}`);
      
      console.log('\n📦 Items with coupons:');
      order.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name}`);
        console.log(`     SKU: ${item.sku}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Price: ₦${item.price.toLocaleString()}`);
        console.log(`     Total: ₦${item.total.toLocaleString()}`);
        if (item.coupon) {
          console.log(`     🎫 Coupon: ${item.coupon.code} (${item.coupon.name}) - ${item.coupon.type} ${item.coupon.value}${item.coupon.type === 'PERCENTAGE' ? '%' : ''}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No orders with coupons found');
    }

    // Also test with another customer
    const customerEmail2 = 'baawapay+elizabeth.johnson@gmail.com';
    console.log(`\n📧 Testing orders for customer: ${customerEmail2}`);

    const url2 = `http://localhost:3000/api/pos/analytics/customers/${encodeURIComponent(customerEmail2)}/orders`;
    const response2 = await makeRequest(url2);
    
    if (response2.status === 200) {
      const data2 = response2.data;
      if (data2.success) {
        const ordersWithCoupons2 = data2.data.filter(order => 
          order.items.some(item => item.coupon)
        );
        console.log(`✅ Found ${data2.data.length} orders, ${ordersWithCoupons2.length} with coupons`);
      }
    }

    console.log('\n✅ Customer Orders API with coupons test completed!');

  } catch (error) {
    console.error('❌ Error testing customer orders API:', error);
  }
}

testCustomerOrdersWithCoupons(); 