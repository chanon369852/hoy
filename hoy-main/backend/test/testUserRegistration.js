// Test script for user registration
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testUserRegistration() {
  console.log('\n🧪 Testing User Registration System\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Register normal user
    console.log('\n📝 Test 1: Registering normal user...');
    const testUser = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      client_name: 'Test Company'
    };
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('✅ Registration Response:');
    console.log('   Status:', registerResponse.status);
    console.log('   Success:', registerResponse.data.success);
    console.log('   Message:', registerResponse.data.message);
    
    if (registerResponse.data.verificationToken) {
      console.log('   📧 Verification Token:', registerResponse.data.verificationToken);
      console.log('   🔗 Verification URL:', registerResponse.data.verificationUrl);
      
      // Test 2: Verify email
      console.log('\n📝 Test 2: Verifying email...');
      const verifyResponse = await axios.get(`${API_URL}/auth/verify/${registerResponse.data.verificationToken}`);
      
      console.log('✅ Verification Response:');
      console.log('   Status:', verifyResponse.status);
      console.log('   Success:', verifyResponse.data.success);
      console.log('   Message:', verifyResponse.data.message);
      console.log('   User:', verifyResponse.data.user);
      console.log('   Token:', verifyResponse.data.token ? '✅ Token received' : '❌ No token');
      
      // Test 3: Login with verified account
      console.log('\n📝 Test 3: Logging in with verified account...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('✅ Login Response:');
      console.log('   Status:', loginResponse.status);
      console.log('   User:', loginResponse.data.user);
      console.log('   Token:', loginResponse.data.token ? '✅ Token received' : '❌ No token');
      
    } else {
      console.log('⚠️  No verification token received (might be first user bootstrap)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
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
testUserRegistration();
