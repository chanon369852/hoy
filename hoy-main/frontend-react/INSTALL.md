# วิธีติดตั้งและรัน Frontend React + Tailwind CSS

## ขั้นตอนที่ 1: ติดตั้ง Dependencies

```bash
cd frontend-react
npm install
```

## ขั้นตอนที่ 2: รัน Development Mode

### เปิด Terminal 2 แท็บ:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (React):**
```bash
cd frontend-react
npm run dev
```

Frontend จะรันที่ http://localhost:3000 และจะ proxy API requests ไปที่ backend (port 5000)

## ขั้นตอนที่ 3: Build สำหรับ Production

```bash
cd frontend-react
npm run build
```

หลังจาก build แล้ว backend จะ serve React app อัตโนมัติเมื่อตั้ง `NODE_ENV=production`

## ใช้งาน

- เปิด http://localhost:3000
- สมัครสมาชิกหรือล็อกอิน
- ใช้งาน Dashboard, Clients, Users, Products, Orders, Alerts, Ad Metrics, SEO Metrics, Uploads

## หมายเหตุ

- ใน development mode ใช้ Vite dev server (port 3000) ที่มี hot reload
- ใน production mode backend จะ serve React build จาก `frontend-build` folder



