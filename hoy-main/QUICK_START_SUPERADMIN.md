# 🚀 Quick Start: สร้าง Super Admin

## ขั้นตอนที่ 1: รัน Database Migration

เปิด phpMyAdmin (`http://localhost/phpmyadmin`) และรัน SQL นี้:

```sql
ALTER TABLE users 
MODIFY COLUMN role ENUM('superadmin', 'admin', 'manager', 'viewer') DEFAULT 'viewer';
```

---

## ขั้นตอนที่ 2: สร้าง Super Admin User

### วิธีที่ 1: ใช้ Script (ง่ายที่สุด) ⭐

1. แก้ไขไฟล์ `backend/.env`:
```env
SUPERADMIN_EMAIL=superadmin@rga.com
SUPERADMIN_PASSWORD=superadmin123
SUPERADMIN_NAME=Super Admin
```

2. รันคำสั่ง:
```bash
cd backend
npm run create-superadmin
```

3. ใช้ข้อมูลนี้ Login:
- Email: `superadmin@rga.com`
- Password: `superadmin123`

### วิธีที่ 2: สร้างด้วย SQL โดยตรง

1. Hash password ด้วย Node.js:
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash))"
```

2. Copy hash ที่ได้ แล้วรัน SQL ใน phpMyAdmin:
```sql
INSERT INTO users (name, email, password_hash, role, status) 
VALUES ('Super Admin', 'superadmin@rga.com', 'PASTE_HASH_HERE', 'superadmin', 'active');
```

---

## ✅ ตรวจสอบ

1. Login ด้วย Super Admin account
2. ควรเห็น:
   - "Super Admin Dashboard" ในหน้า Dashboard
   - "SUPER ADMIN" badge สีแดง
   - "Super Admin Panel" ใน navbar
   - Redirect ไปหน้า `/admin` อัตโนมัติ

---

## 🎯 สิทธิ์ของ Super Admin

- ✅ เข้าถึงทุกอย่าง (เหมือน Admin แต่สูงกว่า)
- ✅ เห็นข้อมูลทั้งหมด (ไม่จำกัด client_id)
- ✅ จัดการผู้ใช้ทั้งหมด
- ✅ เปลี่ยน role ของผู้ใช้ได้ (รวมถึงสร้าง Super Admin คนอื่น)
- ✅ เข้าสู่ระบบไปหน้า Admin Dashboard โดยอัตโนมัติ

---

## ⚠️ หมายเหตุ

- Super Admin เท่านั้นที่สามารถสร้าง Super Admin คนอื่นได้
- ควรเปลี่ยนรหัสผ่านหลังจากสร้าง Super Admin
- ใน Production ควรเพิ่ม security checks เพิ่มเติม


