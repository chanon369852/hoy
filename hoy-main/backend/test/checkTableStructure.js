// Check table structures
const pool = require('../utils/db');

async function checkTableStructure() {
  console.log('\n🔍 Checking Table Structures\n');
  console.log('='.repeat(50));
  
  try {
    // Check campaigns table
    console.log('\n📊 Campaigns Table Structure:');
    const [campaignCols] = await pool.execute('DESCRIBE campaigns');
    campaignCols.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check metrics_daily table
    console.log('\n📊 Metrics Daily Table Structure:');
    const [metricsCols] = await pool.execute('DESCRIBE metrics_daily');
    metricsCols.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check products table
    console.log('\n📊 Products Table Structure:');
    const [productCols] = await pool.execute('DESCRIBE products');
    productCols.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check orders table
    console.log('\n📊 Orders Table Structure:');
    const [orderCols] = await pool.execute('DESCRIBE orders');
    orderCols.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
