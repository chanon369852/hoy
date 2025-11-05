-- ============================================
-- Migration: เพิ่ม Super Admin Role สำหรับ XAMPP
-- ============================================
-- วิธีรัน: เปิด phpMyAdmin -> เลือก database rga_dashboard -> SQL tab -> Copy-paste -> Go
-- ============================================

-- 1. อัปเดต role enum ให้รองรับ 'superadmin'
ALTER TABLE users 
MODIFY COLUMN role ENUM('superadmin', 'admin', 'manager', 'viewer') DEFAULT 'viewer';

-- 2. (Optional) สร้าง Super Admin User
-- แก้ไข email, password_hash ตามต้องการ
-- INSERT INTO users (name, email, password_hash, role, status) 
-- VALUES ('Super Admin', 'superadmin@rga.com', '$2b$10$...', 'superadmin', 'active');
-- หมายเหตุ: password_hash ต้อง hash ด้วย bcrypt ก่อน

-- ============================================
-- ตรวจสอบผลลัพธ์
-- ============================================
-- DESCRIBE users;
-- SELECT id, name, email, role FROM users WHERE role = 'superadmin';


