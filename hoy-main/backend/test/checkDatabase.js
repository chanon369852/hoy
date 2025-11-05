// Check what data exists in database
const pool = require('../utils/db');

async function checkDatabase() {
  console.log('\n🔍 Checking Database Contents\n');
  console.log('='.repeat(50));
  
  try {
    // Check users
    console.log('\n📊 Users:');
    const [users] = await pool.execute(
      'SELECT id, name, email, role, status FROM users ORDER BY id DESC LIMIT 5'
    );
    console.log(`   Found ${users.length} users (showing last 5):`);
    users.forEach(u => {
      console.log(`   - [${u.id}] ${u.email} (${u.role}, ${u.status})`);
    });
    
    // Check clients
    console.log('\n📊 Clients:');
    const [clients] = await pool.execute(
      'SELECT id, name, email FROM clients ORDER BY id DESC LIMIT 5'
    );
    console.log(`   Found ${clients.length} clients (showing last 5):`);
    clients.forEach(c => {
      console.log(`   - [${c.id}] ${c.name} (${c.email})`);
    });
    
    // Check if dashboard tables exist
    console.log('\n📊 Dashboard Tables:');
    
    try {
      const [campaigns] = await pool.execute('SELECT COUNT(*) as count FROM campaigns');
      console.log(`   ✅ campaigns table exists (${campaigns[0].count} records)`);
    } catch (err) {
      console.log('   ❌ campaigns table missing');
    }
    
    try {
      const [metrics] = await pool.execute('SELECT COUNT(*) as count FROM metrics_daily');
      console.log(`   ✅ metrics_daily table exists (${metrics[0].count} records)`);
    } catch (err) {
      console.log('   ❌ metrics_daily table missing');
    }
    
    try {
      const [metricsH] = await pool.execute('SELECT COUNT(*) as count FROM metrics_hourly');
      console.log(`   ✅ metrics_hourly table exists (${metricsH[0].count} records)`);
    } catch (err) {
      console.log('   ❌ metrics_hourly table missing');
    }
    
    // Check products
    console.log('\n📊 Products:');
    try {
      const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
      console.log(`   ✅ products table exists (${products[0].count} records)`);
    } catch (err) {
      console.log('   ❌ products table missing');
    }
    
    // Check orders
    console.log('\n📊 Orders:');
    try {
      const [orders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
      console.log(`   ✅ orders table exists (${orders[0].count} records)`);
    } catch (err) {
      console.log('   ❌ orders table missing');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database check completed!');
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
