ระะ-- ============================================
-- Migration: Email Verification สำหรับ XAMPP
-- ============================================
-- วิธีรัน: เปิด phpMyAdmin -> เลือก database rga_dashboard -> SQL tab -> Copy-paste -> Go
-- ============================================

-- 1. เพิ่มคอลัมน์ verification_token
ALTER TABLE users 
ADD COLUMN verification_token VARCHAR(255) NULL;

-- 2. เพิ่มคอลัมน์ token_expiry  
ALTER TABLE users 
ADD COLUMN token_expiry DATETIME NULL;

-- 3. อัปเดต status enum (ถ้า error ให้ดู README_XAMPP.md)
ALTER TABLE users 
MODIFY COLUMN status ENUM('active', 'inactive', 'pending') DEFAULT 'pending';

-- 4. เพิ่ม Index
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_email_status ON users(email, status);

-- ============================================
-- ตรวจสอบผลลัพธ์ (รันคำสั่งนี้เพื่อดู)
-- ============================================
-- DESCRIBE users;


