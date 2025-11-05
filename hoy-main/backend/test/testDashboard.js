// Test Dashboard API endpoints
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function testDashboard() {
  console.log('\n🧪 Testing Dashboard System\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Login to get token
    console.log('\n📝 Step 1: Login to get auth token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testuser1762336628460@example.com', // Use latest test user
      password: 'password123'
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    
    // Step 2: Test Dashboard Root
    console.log('\n📝 Step 2: Testing Dashboard Root (/)...');
    const dashResponse = await axios.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Dashboard Root Response:');
    console.log('   Status:', dashResponse.status);
    console.log('   Data:', JSON.stringify(dashResponse.data, null, 2));
    
    // Step 3: Test Dashboard Summary
    console.log('\n📝 Step 3: Testing Dashboard Summary...');
    try {
      const summaryResponse = await axios.get(`${API_URL}/dashboard/summary`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Summary Response:');
      console.log('   Status:', summaryResponse.status);
      console.log('   Totals:', summaryResponse.data.data.totals);
      console.log('   Trend items:', summaryResponse.data.data.trend.length);
    } catch (err) {
      console.log('⚠️  Summary endpoint error:', err.response?.status, err.response?.data?.message || err.message);
    }
    
    // Step 4: Test Campaigns List
    console.log('\n📝 Step 4: Testing Campaigns List...');
    try {
      const campaignsResponse = await axios.get(`${API_URL}/dashboard/campaigns`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Campaigns Response:');
      console.log('   Status:', campaignsResponse.status);
      console.log('   Campaigns count:', campaignsResponse.data.data.length);
      if (campaignsResponse.data.data.length > 0) {
        console.log('   First campaign:', campaignsResponse.data.data[0]);
      }
    } catch (err) {
      console.log('⚠️  Campaigns endpoint error:', err.response?.status, err.response?.data?.message || err.message);
    }
    
    // Step 5: Test Trend
    console.log('\n📝 Step 5: Testing Trend...');
    try {
      const trendResponse = await axios.get(`${API_URL}/dashboard/trend`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Trend Response:');
      console.log('   Status:', trendResponse.status);
      console.log('   Trend items:', trendResponse.data.data.length);
    } catch (err) {
      console.log('⚠️  Trend endpoint error:', err.response?.status, err.response?.data?.message || err.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Dashboard API tests completed!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run tests
testDashboard();
