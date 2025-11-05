# 🔐 คู่มือตั้งค่า Super Admin

## 📋 ขั้นตอนการตั้งค่า

### 1. รัน Database Migration

เปิด phpMyAdmin และรัน SQL นี้:

```sql
-- ไฟล์: backend/migrations/add_superadmin_role.sql

ALTER TABLE users 
MODIFY COLUMN role ENUM('superadmin', 'admin', 'manager', 'viewer') DEFAULT 'viewer';
```

**วิธีรัน:**
1. เปิด `http://localhost/phpmyadmin`
2. เลือก database `rga_dashboard`
3. คลิก tab "SQL"
4. Copy-paste SQL ด้านบน
5. คลิก "Go"

---

### 2. สร้าง Super Admin User

#### วิธีที่ 1: ใช้ Script (แนะนำ)

1. แก้ไขไฟล์ `.env` ใน backend folder:
```env
SUPERADMIN_EMAIL=superadmin@rga.com
SUPERADMIN_PASSWORD=your_secure_password
SUPERADMIN_NAME=Super Admin
```

2. รันคำสั่ง:
```bash
cd backend
npm run create-superadmin
```

#### วิธีที่ 2: สร้างด้วย SQL (phpMyAdmin)

1. Hash password ด้วย bcrypt (ใช้ Node.js):
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash))"
```

2. Copy hash ที่ได้ แล้วรัน SQL:
```sql
INSERT INTO users (name, email, password_hash, role, status) 
VALUES ('Super Admin', 'superadmin@rga.com', 'PASTE_HASH_HERE', 'superadmin', 'active');
```

---

### 3. เข้าสู่ระบบ

1. เปิดหน้า Login: `http://localhost:5173/login`
2. ใช้ Email และ Password ที่ตั้งไว้
3. ระบบจะ redirect ไปหน้า **Admin Dashboard** อัตโนมัติ

---

## 🎯 สิทธิ์ของ Super Admin

### ✅ สิ่งที่ Super Admin ทำได้:

1. **เข้าถึงทุกอย่าง** - เหมือน Admin แต่มีสิทธิ์สูงกว่า
2. **เห็นข้อมูลทั้งหมด** - ไม่จำกัด client_id
3. **จัดการผู้ใช้ทั้งหมด** - สามารถเปลี่ยน role ของผู้ใช้ได้
4. **เข้าสู่ระบบไปหน้า Admin Dashboard** - โดยอัตโนมัติ
5. **กำหนด Super Admin คนอื่น** - Super Admin เท่านั้นที่สามารถกำหนด role เป็น 'superadmin' ได้

---

## 🔍 ตรวจสอบ Super Admin

### ดูรายการ Super Admin:
```sql
SELECT id, name, email, role, status, created_at 
FROM users 
WHERE role = 'superadmin';
```

### ตรวจสอบสิทธิ์:
- Login แล้วควรเห็น "Super Admin Panel" ใน navbar
- หน้า Dashboard จะแสดง "Super Admin Dashboard"
- มี badge "SUPER ADMIN" สีแดง

---

## ⚠️ ข้อควรระวัง

1. **Security**: ควรเปลี่ยนรหัสผ่านหลังจากสร้าง Super Admin
2. **Role Protection**: Super Admin เท่านั้นที่สามารถสร้าง Super Admin คนอื่นได้
3. **Backup**: ควร backup database ก่อนรัน migration

---

## 🐛 Troubleshooting

### Error: "ER_BAD_FIELD_ERROR" หรือ "Unknown column 'role'"
**แก้ไข:** ต้องรัน migration ก่อน (`add_superadmin_role.sql`)

### Error: "Duplicate entry" เมื่อสร้าง Super Admin
**แก้ไข:** Super Admin มีอยู่แล้ว ตรวจสอบด้วย:
```sql
SELECT * FROM users WHERE role = 'superadmin';
```

### ไม่ redirect ไปหน้า Admin
**แก้ไข:** ตรวจสอบว่า:
- Database migration รันแล้ว
- User มี role = 'superadmin'
- ลอง logout และ login ใหม่

---

## 📝 ตัวอย่างการใช้งาน

### สร้าง Super Admin ใหม่:
```bash
cd backend
npm run create-superadmin
```

### เปลี่ยน User เป็น Super Admin (ต้องเป็น Super Admin อยู่แล้ว):
1. Login เป็น Super Admin
2. ไปที่ `/users`
3. แก้ไข role ของ user เป็น 'superadmin'

---

## ✅ สรุป

- ✅ เพิ่ม role 'superadmin' ใน database
- ✅ Super Admin redirect ไป `/admin` อัตโนมัติ
- ✅ Super Admin มีสิทธิ์สูงสุด
- ✅ Super Admin เท่านั้นที่สร้าง Super Admin ได้

**สถานะ:** พร้อมใช้งาน! 🚀


