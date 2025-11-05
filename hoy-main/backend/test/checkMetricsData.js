// Check metrics data
const pool = require('../utils/db');

async function checkMetricsData() {
  console.log('\n🔍 Checking Metrics Data\n');
  console.log('='.repeat(50));
  
  try {
    // Check campaigns with details
    console.log('\n📊 Campaigns:');
    const [campaigns] = await pool.execute(
      'SELECT * FROM campaigns LIMIT 5'
    );
    console.log(`   Found ${campaigns.length} campaigns:`);
    campaigns.forEach(c => {
      console.log(`   - [${c.id}] ${c.name} (client_id: ${c.client_id}, provider: ${c.provider})`);
    });
    
    // Check metrics_daily with details
    console.log('\n📊 Metrics Daily:');
    const [metrics] = await pool.execute(
      'SELECT * FROM metrics_daily LIMIT 10'
    );
    console.log(`   Found ${metrics.length} metrics records:`);
    metrics.forEach(m => {
      console.log(`   - [${m.id}] Date: ${m.date}, Client: ${m.client_id}, Campaign: ${m.campaign_id}, Provider: ${m.provider}`);
      console.log(`     Impressions: ${m.impressions}, Clicks: ${m.clicks}, Cost: ${m.cost}`);
    });
    
    // Check if test user's client has data
    console.log('\n📊 Test User Client Data:');
    const testClientIds = [11, 12, 13, 14, 15]; // Recent test clients
    for (const clientId of testClientIds) {
      const [clientMetrics] = await pool.execute(
        'SELECT COUNT(*) as count FROM metrics_daily WHERE client_id = ?',
        [clientId]
      );
      const [clientCampaigns] = await pool.execute(
        'SELECT COUNT(*) as count FROM campaigns WHERE client_id = ?',
        [clientId]
      );
      console.log(`   Client ${clientId}: ${clientMetrics[0].count} metrics, ${clientCampaigns[0].count} campaigns`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Metrics data check completed!');
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkMetricsData();
