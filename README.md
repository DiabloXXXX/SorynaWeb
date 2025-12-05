# Hapiyo Coffee QR Order System

Modern QR-based ordering system for Hapiyo Coffee built with Next.js, Vercel KV (Redis), and Google Apps Script.

## 🚀 Features

- **QR Code Ordering**: Customers scan QR code at their table to order
- **Real-time Menu**: Menu stored in Redis for fast access and real-time updates
- **Order Management**: Orders stored in Google Sheets via Apps Script
- **Admin Panel**: Manage menu items, categories, and orders
- **Mobile-First Design**: Responsive design optimized for mobile devices

## 📋 Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Menu Database**: Vercel KV (Redis)
- **Order Database**: Google Sheets + Apps Script
- **Deployment**: Vercel

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hapiyo-coffee
npm install
```

### 2. Setup Vercel KV (Redis)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create or select your project
3. Go to **Storage** tab
4. Click **Create Database** → Select **KV**
5. Name it `hapiyo-menu-db`
6. Environment variables will be automatically added to your project

For local development, copy the environment variables to `.env.local`:

```env
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### 3. Setup Google Sheets + Apps Script

1. **Create Google Sheets**:
   - Create a new Google Sheets document
   - Add 3 sheets: `Orders`, `OrderItems`, `Config`
   - Copy the Sheet ID from the URL

2. **Setup Apps Script**:
   - Go to Extensions → Apps Script
   - Copy contents from `scripts/google-apps-script.js`
   - Replace `YOUR_SHEET_ID_HERE` with your Sheet ID
   - Run `setupSheets()` function once to initialize headers
   - Deploy as Web App:
     - Click **Deploy** → **New deployment**
     - Type: **Web app**
     - Execute as: **Me**
     - Who has access: **Anyone**
   - Copy the Web App URL

3. **Add to environment**:
   ```env
   NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### 4. Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Vercel KV (auto-populated if using Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Google Apps Script
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/YOUR_ID/exec

# App Config
NEXT_PUBLIC_SHOP_NAME=Hapiyo Coffee
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 5. Seed Menu Data

After setup, seed initial menu data:

```bash
npm run dev
```

Then visit `/admin` and click "Seed Data" button, or make a POST request to:
```
POST /api/seed
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Customer Flow

1. Scan QR code at table (or visit `/?table=5`)
2. Browse menu and add items to cart
3. Enter name and confirm order
4. Track order status

### Admin Panel

Visit `/admin` to:
- Manage menu items (Add/Edit/Delete)
- View and update order status
- Monitor sales (Finance tab)

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── menu/           # Menu CRUD API (Vercel KV)
│   │   ├── categories/     # Category API
│   │   └── seed/           # Seed data API
│   ├── admin/              # Admin panel
│   └── page.tsx            # Customer ordering page
├── components/
│   ├── admin/              # Admin components
│   ├── screens/            # Customer flow screens
│   └── ui/                 # UI components (shadcn)
├── lib/
│   ├── menuService.ts      # Menu API client
│   ├── orderService.ts     # Order API client (GAS)
│   └── cartContext.tsx     # Cart state management
└── scripts/
    └── google-apps-script.js  # GAS backend code
```

## 🔗 API Endpoints

### Menu API (Next.js → Vercel KV)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menus |
| GET | `/api/menu?category=coffee` | Get by category |
| POST | `/api/menu` | Create menu |
| PUT | `/api/menu/[id]` | Update menu |
| DELETE | `/api/menu/[id]` | Delete menu |
| GET | `/api/categories` | Get categories |
| POST | `/api/seed` | Seed initial data |

### Order API (Google Apps Script)

| Action | Method | Description |
|--------|--------|-------------|
| `createOrder` | POST | Create new order |
| `getOrders` | GET | Get all orders |
| `getOrderById` | GET | Get order details |
| `updateOrderStatus` | POST | Update status |
| `deleteOrder` | POST | Delete order |

## 🎨 Customization

### Branding

Update these files for your brand:
- `app/layout.tsx` - Title and metadata
- `public/icon.svg` - Favicon
- Theme colors in `tailwind.config.ts`

### Menu Categories

Default categories: `coffee`, `non-coffee`, `snacks`, `meals`

Add new categories through Admin Panel or update seed data in `/api/seed/route.ts`

## 📄 License

MIT License

## 🤝 Support

For issues or questions, please open a GitHub issue.
