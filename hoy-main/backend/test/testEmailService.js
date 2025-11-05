// Test if emailService can be loaded
const { sendVerificationEmail } = require('../utils/emailService');

console.log('✅ emailService loaded successfully');
console.log('sendVerificationEmail type:', typeof sendVerificationEmail);
console.log('sendVerificationEmail:', sendVerificationEmail);

// Test sending email
async function testEmail() {
  const result = await sendVerificationEmail(
    'test@example.com',
    'http://localhost:5173/verify/test-token'
  );
  console.log('Email result:', result);
}

testEmail().catch(console.error);
