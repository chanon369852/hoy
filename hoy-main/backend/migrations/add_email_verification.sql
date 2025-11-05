-- Migration: Add email verification fields to users table
-- สำหรับ XAMPP / MySQL
-- วิธีรัน: เปิด phpMyAdmin -> เลือก database rga_dashboard -> คลิก SQL tab -> Copy-paste SQL นี้ -> Go

-- ============================================
-- ขั้นตอนที่ 1: เพิ่มคอลัมน์ verification_token และ token_expiry
-- ============================================
-- ตรวจสอบว่ามีคอลัมน์อยู่แล้วหรือไม่ (ถ้ามีแล้วจะ error แต่ไม่เป็นไร)
ALTER TABLE users 
ADD COLUMN verification_token VARCHAR(255) NULL;

ALTER TABLE users 
ADD COLUMN token_expiry DATETIME NULL;

-- ============================================
-- ขั้นตอนที่ 2: อัปเดต status enum ให้รองรับ 'pending'
-- ============================================
-- ตรวจสอบคอลัมน์ status ก่อน
-- MySQL จะ error ถ้า enum ไม่มี 'pending' ในตารางที่มีข้อมูลอยู่แล้ว
-- ถ้า error ให้รันคำสั่งนี้ทีละคำสั่ง

-- ดูโครงสร้างปัจจุบัน (ถ้าต้องการ)
-- DESCRIBE users;

-- อัปเดต enum
ALTER TABLE users 
MODIFY COLUMN status ENUM('active', 'inactive', 'pending') DEFAULT 'pending';

-- ============================================
-- ขั้นตอนที่ 3: เพิ่ม Index สำหรับการค้นหาที่เร็วขึ้น
-- ============================================
-- ตรวจสอบว่ามี index อยู่แล้วหรือไม่ (ถ้ามีแล้วจะ error แต่ไม่เป็นไร)

-- เพิ่ม index สำหรับ verification_token
CREATE INDEX idx_verification_token ON users(verification_token);

-- เพิ่ม index สำหรับ email และ status
CREATE INDEX idx_email_status ON users(email, status);

-- ============================================
-- ตรวจสอบผลลัพธ์
-- ============================================
-- รันคำสั่งนี้เพื่อดูโครงสร้างตาราง
-- DESCRIBE users;

-- รันคำสั่งนี้เพื่อดู index ทั้งหมด
-- SHOW INDEX FROM users;

