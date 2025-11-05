// ** utils/emailService.js **
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development, use ethereal.email (fake SMTP service)
  if (process.env.NODE_ENV !== 'production') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.password'
      }
    });
  }

  // For production, use real SMTP (Gmail, SendGrid, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RGA Dashboard" <noreply@rga-dashboard.com>',
      to: email,
      subject: 'ยืนยันอีเมลของคุณ - Verify Your Email',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">ยืนยันอีเมลของคุณ</h2>
          <p style="color: #666;">ขอบคุณที่สมัครสมาชิกกับ RGA Dashboard</p>
          <p style="color: #666;">กรุณาคลิกที่ลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            ยืนยันอีเมล
          </a>
          <p style="color: #666;">หรือคัดลอกลิงก์นี้ไปวางในบราวเซอร์:</p>
          <p style="color: #007bff; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง<br>
            This link will expire in 24 hours.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    // For development, show preview URL
    if (process.env.NODE_ENV !== 'production' && info.previewUrl) {
      console.log('Preview URL:', info.previewUrl);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: info.previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail
};
