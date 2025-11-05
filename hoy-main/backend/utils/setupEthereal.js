// Script to create Ethereal Email account for testing
const nodemailer = require('nodemailer');

async function setupEthereal() {
  try {
    // Create test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('\n✅ Ethereal Email Account Created!\n');
    console.log('Add these to your .env file:\n');
    console.log(`ETHEREAL_USER=${testAccount.user}`);
    console.log(`ETHEREAL_PASS=${testAccount.pass}`);
    console.log('\nYou can view sent emails at: https://ethereal.email/messages');
    console.log(`Login with: ${testAccount.user} / ${testAccount.pass}\n`);
  } catch (error) {
    console.error('Error creating Ethereal account:', error);
  }
}

setupEthereal();
