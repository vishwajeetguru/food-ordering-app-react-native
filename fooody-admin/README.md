# Fooody Admin — Restaurant Management Dashboard

Premium modern SaaS admin panel for the Fooody food ordering app. Connected to the existing `fooody-backend` via versioned API (`/api/v1`) — no duplicate backend or database.

## Stack

- **Vite 6 + React 19 + TypeScript** — fast, modern
- **React Router 7** — protected routes
- **TanStack Query 5** — server state
- **Zustand 5** — auth state
- **Tailwind CSS 3** — styling (warm off-white + coral-orange #FF5A3D)
- **Axios** — API client with JWT interceptor
- **React Hook Form + Zod** — forms & validation
- **Lucide React** — icons
- **Sonner** — toasts

## Features

- **Auth:** `POST /auth/admin-login` → Firebase ID token → `Bearer` on all admin calls, `requireRole('admin')` guard
- **Dashboard:** real analytics from `GET /admin/analytics` (revenue, orders, products, customers, 7-day charts, recent orders)
- **Products:** list/search/filter/sort/paginate, create/edit/delete/duplicate, toggle available/popular, image preview, validation (price/discount)
- **Categories:** CRUD, image, ordering, active toggle, delete blocked if products exist
- **Popular Today:** add/remove popular products, reorder, limit, enable/disable, customer preview
- **Offers:** create/edit/delete, discount type/percentage/fixed, min order, dates, code, usage limit, banner image, active/scheduled/expired filters
- **Orders:** list/search/filter by status/date, view details, update status (`pending → delivered/cancelled`), customer + payment info
- **Customers:** list/search, view details, order history, spending, enable/disable
- **Restaurant Settings:** name, logo, address, phone, hours, open/closed, delivery charge, tax, pricing
- **Home Content (Banners):** CRUD banners (title/subtitle/coupon/image/order/active), preview, home settings (popular limit, section toggles)
- **Profile:** admin info, logout

## Project Structure

```
fooody-admin/
├── src/
│   ├── api/client.ts          # axios instance + auth interceptor
│   ├── api/admin.api.ts       # typed API helpers
│   ├── store/authStore.ts     # zustand auth (token + user in localStorage)
│   ├── layouts/AdminLayout.tsx# sidebar + header + responsive drawer
│   ├── components/ui/         # Button, Input, Card, Table, Modal, Badge, Skeleton
│   ├── components/ProductForm.tsx
│   ├── pages/                 # Dashboard, Products, Categories, Popular, Offers, Orders, Customers, Settings, HomeContent, Profile, Login
│   ├── types/                 # shared types (Product, Category, Order, etc.)
│   ├── lib/utils.ts
│   ├── App.tsx                # Router + QueryClient + Toaster
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.js
└── .env                       # VITE_API_URL
```

## Backend Integration

Reuses `fooody-backend` — **no duplicate APIs or DB**. New admin endpoints added to existing backend:

- `POST /api/v1/auth/admin-login` — email+password → ID token (supports `admin123` alias in dev)
- `GET /api/v1/admin/analytics` — aggregated stats
- `GET /api/v1/admin/users`, `GET/PATCH /api/v1/admin/users/:id` — customers
- `GET /api/v1/admin/orders` — all orders
- `GET/POST/PATCH/DELETE /api/v1/admin/banners` — banners
- `GET/PATCH /api/v1/admin/home-settings` — home settings
- `GET/PATCH /api/v1/admin/settings`, `PATCH /api/v1/admin/restaurant` — settings
- `POST/PATCH/DELETE /api/v1/products` (plus `DELETE` + `POST /:id/duplicate`)
- `POST/PATCH/DELETE /api/v1/categories`
- `POST/PATCH/DELETE /api/v1/offers`
- `PATCH /api/v1/restaurants/default` — restaurant settings
- `GET /api/v1/home` now includes banners + settings for customer app

All admin writes are `authenticate + requireRole('admin')` protected.

## Environment

- `fooody-admin/.env` → `VITE_API_URL=http://localhost:5000/api/v1`
- `fooody-backend/.env` → `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json`, `FIREBASE_API_KEY=...`, `ALLOW_MOCK_AUTH=true`

## Running

```bash
# Backend (port 5000)
cd fooody-backend
npm run dev
# Admin (port 5174)
cd fooody-admin
npm install
npm run dev
# Login: admin@foody.app / admin123  (also accepts Admin123! for Firebase)
```

Admin panel: http://localhost:5174
Backend: http://localhost:5000/health → {success:true}
Customer app still works — no breaking changes.

## Production Notes

- Set `VITE_API_URL` to your deployed backend URL
- Create admin user in Firebase Auth + Firestore `users/{uid}.role = "admin"`
- Set `FIREBASE_API_KEY` on backend for password verification
- Set `ALLOW_MOCK_AUTH=false` (default outside test) — mock tokens only for local dev
- Backend `CORS_ORIGIN` must be explicit domains in production
