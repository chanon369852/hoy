// Seed dashboard data for test users
const pool = require('../utils/db');

async function seedDashboardData() {
  console.log('\n🌱 Seeding Dashboard Data\n');
  console.log('='.repeat(50));
  
  try {
    // Get a test user to seed data for
    const [users] = await pool.execute(
      'SELECT id, client_id, email FROM users WHERE client_id IS NOT NULL ORDER BY id DESC LIMIT 1'
    );
    
    if (users.length === 0) {
      console.log('❌ No users with client_id found');
      process.exit(1);
    }
    
    const testUser = users[0];
    console.log(`\n✅ Using user: ${testUser.email} (client_id: ${testUser.client_id})`);
    
    // Create a campaign for this client
    console.log('\n📝 Creating campaign...');
    const [campaignResult] = await pool.execute(
      `INSERT INTO campaigns (client_id, name, provider, status, external_id)
       VALUES (?, 'Test Campaign - Google Ads', 'google_ads', 'active', 'CAMP-001')`,
      [testUser.client_id]
    );
    const campaignId = campaignResult.insertId;
    console.log(`   ✅ Campaign created: ID ${campaignId}`);
    
    // Create metrics data for the last 7 days
    console.log('\n📝 Creating metrics data for last 7 days...');
    for (let i = 6; i >= 0; i--) {
      const impressions = 1000 + Math.floor(Math.random() * 1000);
      const clicks = Math.floor(impressions * (0.03 + Math.random() * 0.05)); // 3-8% CTR
      const cost = clicks * (2 + Math.random() * 3); // 2-5 THB per click
      const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.10)); // 5-15% conversion
      const revenue = conversions * (500 + Math.random() * 1500); // 500-2000 THB per conversion
      
      await pool.execute(
        `INSERT INTO metrics_daily (client_id, campaign_id, date, provider, impressions, clicks, cost, conversions, revenue)
         VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), 'google_ads', ?, ?, ?, ?, ?)`,
        [testUser.client_id, campaignId, i, impressions, clicks, cost, conversions, revenue]
      );
      console.log(`   ✅ Day -${i}: ${impressions} impressions, ${clicks} clicks, ${cost.toFixed(2)} THB`);
    }
    
    // Create another campaign (Meta/Facebook)
    console.log('\n📝 Creating Meta campaign...');
    const [fbCampaignResult] = await pool.execute(
      `INSERT INTO campaigns (client_id, name, provider, status, external_id)
       VALUES (?, 'Test Campaign - Meta Ads', 'meta', 'active', 'CAMP-002')`,
      [testUser.client_id]
    );
    const fbCampaignId = fbCampaignResult.insertId;
    console.log(`   ✅ Meta campaign created: ID ${fbCampaignId}`);
    
    // Create Facebook metrics
    console.log('\n📝 Creating Facebook metrics...');
    for (let i = 6; i >= 0; i--) {
      const impressions = 800 + Math.floor(Math.random() * 800);
      const clicks = Math.floor(impressions * (0.04 + Math.random() * 0.06)); // 4-10% CTR
      const cost = clicks * (1.5 + Math.random() * 2.5); // 1.5-4 THB per click
      const conversions = Math.floor(clicks * (0.03 + Math.random() * 0.08)); // 3-11% conversion
      const revenue = conversions * (600 + Math.random() * 1400); // 600-2000 THB per conversion
      
      await pool.execute(
        `INSERT INTO metrics_daily (client_id, campaign_id, date, provider, impressions, clicks, cost, conversions, revenue)
         VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), 'meta', ?, ?, ?, ?, ?)`,
        [testUser.client_id, fbCampaignId, i, impressions, clicks, cost, conversions, revenue]
      );
    }
    console.log(`   ✅ Facebook metrics created`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Dashboard data seeded successfully!');
    console.log('\nNow you can test with:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: password123`);
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDashboardData();
