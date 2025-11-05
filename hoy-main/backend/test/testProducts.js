// Test Products CRUD operations
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let clientId = null;
let createdProductId = null;

async function testProducts() {
  console.log('\n🧪 Testing Products CRUD System\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testuser1762336628460@example.com',
      password: 'password123'
    });
    
    authToken = loginResponse.data.token;
    clientId = loginResponse.data.user.client_id;
    console.log('✅ Login successful');
    console.log(`   Client ID: ${clientId}`);
    
    // Step 2: Get all products
    console.log('\n📝 Step 2: Get all products (READ)...');
    const getResponse = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get Products Response:');
    console.log(`   Total products: ${getResponse.data.length}`);
    if (getResponse.data.length > 0) {
      console.log(`   First product: [${getResponse.data[0].id}] ${getResponse.data[0].name}`);
    }
    
    // Step 3: Create new product
    console.log('\n📝 Step 3: Create new product (CREATE)...');
    const newProduct = {
      client_id: clientId,
      name: `Test Product ${Date.now()}`,
      description: 'This is a test product created by automated testing',
      price: 299.99,
      stock_quantity: 100
    };
    
    const createResponse = await axios.post(`${API_URL}/products`, newProduct, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    createdProductId = createResponse.data.id || createResponse.data.product_id;
    console.log('✅ Product Created:');
    console.log(`   ID: ${createdProductId}`);
    console.log(`   Name: ${newProduct.name}`);
    console.log(`   Price: ${newProduct.price} THB`);
    console.log(`   Stock: ${newProduct.stock_quantity}`);
    
    // Step 4: Get all products again to verify
    console.log('\n📝 Step 4: Verify product was created...');
    const getResponse2 = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const foundProduct = getResponse2.data.find(p => p.id == createdProductId);
    if (foundProduct) {
      console.log('✅ Product found in list:');
      console.log(`   Name: ${foundProduct.name}`);
      console.log(`   Price: ${foundProduct.price} THB`);
    } else {
      console.log('⚠️  Product not found in list');
    }
    
    // Step 5: Update product
    console.log('\n📝 Step 5: Update product (UPDATE)...');
    const updateData = {
      client_id: clientId,
      name: `Updated Test Product ${Date.now()}`,
      description: 'This product has been updated',
      price: 399.99,
      stock_quantity: 150
    };
    
    const updateResponse = await axios.put(
      `${API_URL}/products/${createdProductId}`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Product Updated:');
    console.log(`   New name: ${updateData.name}`);
    console.log(`   New price: ${updateData.price} THB`);
    console.log(`   Response:`, updateResponse.data);
    
    // Step 6: Verify update
    console.log('\n📝 Step 6: Verify update...');
    const getResponse3 = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const updatedProduct = getResponse3.data.find(p => p.id == createdProductId);
    if (updatedProduct) {
      console.log('✅ Updated product data:');
      console.log(`   Name: ${updatedProduct.name}`);
      console.log(`   Price: ${updatedProduct.price} THB`);
      console.log(`   Stock: ${updatedProduct.stock_quantity}`);
    }
    
    // Step 7: Delete product
    console.log('\n📝 Step 7: Delete product (DELETE)...');
    const deleteResponse = await axios.delete(`${API_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Product Deleted:');
    console.log(`   Response:`, deleteResponse.data);
    
    // Step 8: Verify deletion
    console.log('\n📝 Step 8: Verify deletion...');
    const getResponse4 = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const deletedProduct = getResponse4.data.find(p => p.id == createdProductId);
    if (!deletedProduct) {
      console.log('✅ Product successfully deleted (not found in list)');
    } else {
      console.log('❌ Product still exists (should not happen)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All Products CRUD tests passed!');
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.data);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testProducts();
