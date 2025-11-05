// Test nodemailer directly
const nodemailer = require('nodemailer');

console.log('nodemailer:', nodemailer);
console.log('typeof nodemailer:', typeof nodemailer);
console.log('nodemailer.createTransporter:', nodemailer.createTransporter);
console.log('typeof nodemailer.createTransporter:', typeof nodemailer.createTransporter);

if (typeof nodemailer.createTransporter === 'function') {
  console.log('✅ createTransporter is a function');
  const transporter = nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'test@ethereal.email',
      pass: 'test'
    }
  });
  console.log('✅ Transporter created:', transporter);
} else {
  console.log('❌ createTransporter is NOT a function');
}
