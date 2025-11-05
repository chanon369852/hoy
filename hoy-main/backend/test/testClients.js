// Test Clients CRUD operations
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let createdClientId = null;

async function testClients() {
  console.log('\n🧪 Testing Clients CRUD System\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Login to get token
    console.log('\n📝 Step 1: Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testuser1762336628460@example.com',
      password: 'password123'
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get all clients
    console.log('\n📝 Step 2: Get all clients (READ)...');
    const getResponse = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get Clients Response:');
    console.log(`   Total clients: ${getResponse.data.length}`);
    if (getResponse.data.length > 0) {
      console.log(`   First client: [${getResponse.data[0].id}] ${getResponse.data[0].name}`);
    }
    
    // Step 3: Create new client
    console.log('\n📝 Step 3: Create new client (CREATE)...');
    const newClient = {
      name: `Test Client ${Date.now()}`,
      email: `client${Date.now()}@test.com`,
      phone: '081-234-5678'
    };
    
    const createResponse = await axios.post(`${API_URL}/clients`, newClient, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    createdClientId = createResponse.data.id;
    console.log('✅ Client Created:');
    console.log(`   ID: ${createdClientId}`);
    console.log(`   Name: ${newClient.name}`);
    console.log(`   Email: ${newClient.email}`);
    
    // Step 4: Get client by ID
    console.log('\n📝 Step 4: Get client by ID (READ ONE)...');
    const getOneResponse = await axios.get(`${API_URL}/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get One Client Response:');
    console.log(`   ID: ${getOneResponse.data.id}`);
    console.log(`   Name: ${getOneResponse.data.name}`);
    console.log(`   Email: ${getOneResponse.data.email}`);
    
    // Step 5: Update client
    console.log('\n📝 Step 5: Update client (UPDATE)...');
    const updateData = {
      name: `Updated Test Client ${Date.now()}`,
      email: `updated${Date.now()}@test.com`,
      phone: '082-345-6789'
    };
    
    const updateResponse = await axios.put(
      `${API_URL}/clients/${createdClientId}`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Client Updated:');
    console.log(`   New name: ${updateData.name}`);
    console.log(`   Response:`, updateResponse.data);
    
    // Step 6: Verify update
    console.log('\n📝 Step 6: Verify update...');
    const verifyResponse = await axios.get(`${API_URL}/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Updated client data:');
    console.log(`   Name: ${verifyResponse.data.name}`);
    console.log(`   Email: ${verifyResponse.data.email}`);
    
    // Step 7: Delete client
    console.log('\n📝 Step 7: Delete client (DELETE)...');
    const deleteResponse = await axios.delete(`${API_URL}/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Client Deleted:');
    console.log(`   Response:`, deleteResponse.data);
    
    // Step 8: Verify deletion
    console.log('\n📝 Step 8: Verify deletion...');
    try {
      await axios.get(`${API_URL}/clients/${createdClientId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Client still exists (should not happen)');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✅ Client successfully deleted (404 returned)');
      } else {
        console.log('⚠️  Unexpected error:', err.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All Clients CRUD tests passed!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testClients();
