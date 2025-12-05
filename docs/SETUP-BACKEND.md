# 🔗 Panduan Menghubungkan Web ke Backend

## Arsitektur Sistem

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   Vercel KV     │     │  Google Sheets  │
│   (Frontend)    │     │   (Menu DB)     │     │   (Order DB)    │
└────────┬────────┘     └─────────────────┘     └────────▲────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│ Google Apps     │──────────────┘
                        │ Script (API)    │
                        └─────────────────┘
```

---

## STEP 1: Setup Google Sheets Database

### 1.1 Buat Google Sheets Baru
1. Buka https://sheets.google.com
2. Klik **+ Blank** untuk membuat spreadsheet baru
3. Rename menjadi "Hapiyo Coffee Database"

### 1.2 Setup Struktur Database
1. Klik **Extensions** → **Apps Script**
2. Hapus semua kode default
3. Copy-paste seluruh isi file `scripts/setup-sheets.js`
4. Klik **Run** (▶️) dan pilih fungsi `setupDatabase`
5. **Authorize** akses yang diminta
6. Tunggu sampai muncul popup "Setup Selesai!"

### 1.3 Catat Sheet ID
- Sheet ID ada di popup, atau lihat URL:
  ```
  https://docs.google.com/spreadsheets/d/SHEET_ID_DISINI/edit
  ```
- Contoh: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## STEP 2: Deploy Google Apps Script sebagai API

### 2.1 Buat Apps Script Project Baru
1. Di Google Sheets, klik **Extensions** → **Apps Script**
2. Atau buat baru di https://script.google.com

### 2.2 Paste Kode Backend
1. Hapus semua kode yang ada
2. Copy-paste seluruh isi file `scripts/google-apps-script.js`
3. **PENTING**: Ganti `YOUR_SHEET_ID_HERE` dengan Sheet ID kamu:
   ```javascript
   const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
   ```

### 2.3 Deploy sebagai Web App
1. Klik **Deploy** → **New deployment**
2. Klik ⚙️ (gear icon) → Pilih **Web app**
3. Isi form:
   - **Description**: "Hapiyo Coffee API v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Klik **Deploy**
5. **Copy URL** yang muncul (simpan baik-baik!)

URL akan seperti:
```
https://script.google.com/macros/s/AKfycbw.../exec
```

### 2.4 Test API
Buka URL ini di browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

Jika sukses, akan muncul:
```json
{"success":true,"status":"ok","timestamp":"2024-12-05T..."}
```

---

## STEP 3: Setup Vercel KV (Redis)

### 3.1 Buat Vercel KV Database
1. Buka https://vercel.com/dashboard
2. Pilih atau buat project baru
3. Klik tab **Storage**
4. Klik **Create Database** → **KV**
5. Nama: `hapiyo-menu-db`
6. Klik **Create**

### 3.2 Copy Environment Variables
1. Di halaman KV database, klik tab **.env.local**
2. Klik **Copy Snippet**
3. Paste ke file `.env.local` di project kamu

---

## STEP 4: Konfigurasi Environment

### 4.1 Edit file `.env.local`

```env
# Vercel KV (dari Vercel Dashboard)
KV_URL=redis://default:xxx@xxx.kv.vercel-storage.com:6379
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx
KV_REST_API_READ_ONLY_TOKEN=xxx

# Google Apps Script URL (dari Step 2.3)
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/AKfycbw.../exec

# App Config
NEXT_PUBLIC_SHOP_NAME=Hapiyo Coffee
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## STEP 5: Seed Data Menu

### 5.1 Jalankan Dev Server
```bash
npm run dev
```

### 5.2 Seed Menu Data
1. Buka http://localhost:3000/admin
2. Klik tombol **"Seed Data"** di tab Menu Management
3. Atau buka http://localhost:3000/api/seed (POST request)

---

## STEP 6: Test Koneksi

### 6.1 Test Menu API (Vercel KV)
```bash
# Get all menus
curl http://localhost:3000/api/menu

# Get by category
curl http://localhost:3000/api/menu?category=coffee
```

### 6.2 Test Order API (Google Apps Script)
```bash
# Health check
curl "YOUR_GAS_URL?action=health"

# Get orders
curl "YOUR_GAS_URL?action=getOrders"

# Create test order (dari Apps Script Editor)
# Run function: testCreateOrder()
```

### 6.3 Test Full Flow
1. Buka http://localhost:3000/?table=5
2. Browse menu, tambah ke cart
3. Checkout dengan nama
4. Cek Google Sheets - order harus muncul di sheet "Orders"

---

## Troubleshooting

### ❌ "Order service not configured"
- Pastikan `NEXT_PUBLIC_GAS_API_URL` sudah diisi di `.env.local`
- Restart dev server setelah edit `.env.local`

### ❌ "Failed to fetch menus"
- Pastikan Vercel KV credentials sudah benar
- Jalankan seed data terlebih dahulu

### ❌ CORS Error
- Google Apps Script sudah handle CORS
- Pastikan deploy dengan "Who has access: Anyone"

### ❌ "Menu not found" di Sheet
- Jalankan `setupDatabase()` dulu di Apps Script
- Pastikan Sheet ID benar

### ❌ Order tidak masuk ke Sheets
- Cek Apps Script Execution Log
- Pastikan Sheet ID benar di `google-apps-script.js`
- Test dengan `testCreateOrder()` di Apps Script Editor

---

## Quick Reference

| Komponen | URL/Lokasi |
|----------|------------|
| Frontend | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin |
| Menu API | http://localhost:3000/api/menu |
| Seed API | http://localhost:3000/api/seed |
| Google Sheets | https://docs.google.com/spreadsheets/d/YOUR_ID |
| Apps Script | https://script.google.com/d/YOUR_ID |

---

## Deployment ke Vercel

1. Push ke GitHub
2. Import project ke Vercel
3. Add Environment Variables di Vercel Dashboard
4. Deploy!

Environment variables yang perlu ditambahkan di Vercel:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `NEXT_PUBLIC_GAS_API_URL`
- `NEXT_PUBLIC_SHOP_NAME`
- `NEXT_PUBLIC_BASE_URL` (ganti dengan URL production)
