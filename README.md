# 🍔 Food Ordering App — React Native

<p align="center">
  <a href="https://www.instagram.com/vishwa__guru"><img src="https://img.shields.io/badge/Instagram-%40vishwa__guru-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a>
  <a href="https://github.com/vishwajeetguru/food-ordering-app-react-native/stargazers"><img src="https://img.shields.io/github/stars/vishwajeetguru/food-ordering-app-react-native?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars" /></a>
  <img src="https://img.shields.io/badge/Expo%20SDK-57.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</p>

> **Premium single-restaurant food ordering app** — Zomato/Swiggy-inspired **original design**. Full-stack with customer app, admin dashboard, and backend API. API-only architecture — frontend never talks to Firestore directly.

### ⭐ Please Give a Star & Message Before Commercial Use

You **can use this project for commercial use** — the only deal is:

1. **Message me on Instagram before using** — [instagram.com/vishwa__guru](https://www.instagram.com/vishwa__guru) — I can consider and help you customize / set up.
2. **Please give a ⭐ Star** to this repo — it helps a lot!

---

## ✨ Features

### 📱 Customer App (`fooody-frontend` — Expo 57)

- **Auth:** Email OTP (backend SMTP), Magic Link, Email + Password, Google Sign-In (expo-auth-session), Phone OTP with searchable country picker + invisible reCAPTCHA (Expo Go via WebView), SecureStore + Firebase ID Tokens, Session restore & AuthGate, silent single-flight ID-token auto-refresh on 401 with one retry
- **Home:** TopBar (search + avatar), greeting, delivering-to, banner, categories, Popular Today (4), Recommended (API), Offers carousel, restaurant CTA, pull-to-refresh
- **Menu:** Restaurant hero + info card, category chips (API), product grid filtered by category
- **Search:** Reusable `SearchBar` + category filter chips (search within category or all), debounced (300ms), recent searches, results
- **Product:** Detail with size/add-ons, quantity stepper, Add to Cart → View Cart flow, info card
- **Cart & Checkout:** Zustand + AsyncStorage (local-first) + Zomato-style floating cart bar above tabs, delivery fee/tax/discount/total, address, contact, coupon, COD/Online placeholder, `POST /orders`
- **Orders:** Active (pending/preparing/out_for_delivery) / Past (delivered/cancelled) tabs, status badge, `GET /orders`, Order detail with animated tracker (Placed → Preparing → Out for delivery → Delivered) or cancelled state
- **Profile & Extras:** Profile, Edit Profile, Addresses (list/add), Favourites/Wishlist, Notifications (unread badge), Support (tickets: list/new/detail + admin replies), About
- **Maintenance mode:** Admin toggle → realtime full-screen block in the customer app (admins bypassed), plus server-side order block; resolves via Firestore listener with REST polling fallback
- **UI:** Bottom tabs (Home, Menu, Offers, Orders), Ionicons, Reanimated 4.5, LinearGradient, Haptics, 8-point grid, skeleton/empty/error states, `GreetingHeader`, `DeliveryLocationBar`

### 🖥️ Admin Dashboard (`fooody-admin` — Vite + React 19)

- **Auth:** `admin@foody.app / admin123` (also `Admin123!`), `POST /auth/admin-login` → auto-creates/promotes admin user, role-based guard (`requireRole('admin')`), `localStorage` token
- **Layout:** `AdminLayout` with sidebar, protected routes, `ErrorBoundary`, `Toaster`
- **Dashboard:** Analytics (`GET /admin/analytics`) — revenue, orders, customers, categories, today orders/revenue, 7-day charts (Recharts), recent orders, popular products
- **Products:** CRUD + duplicate, filters `isPopular`/`isRecommended`/`isVeg`, available toggle
- **Categories:** CRUD
- **Popular:** Dedicated `isPopular` management
- **Offers:** CRUD (active flag, colors, emoji, tag)
- **Orders:** List all, status update (`pending`/`preparing`/`out_for_delivery`/`delivered`/`cancelled`) → creates user notification
- **Customers:** List users, toggle role (customer ↔ admin), soft delete, view addresses
- **Home Content:** Banners CRUD + Home Settings + hero configuration
- **Settings & Profile:** Restaurant info (`PATCH /admin/restaurant`), global settings
- **Push:** Send broadcast or per-user notification (`POST /admin/notifications/send`)
- **Tickets/Support:** List, status update, admin reply → notifies user

### ⚙️ Backend (`fooody-backend` — Express + Firebase Admin)

- **Versioned API:** `/api/v1`, Helmet, CORS (strict in prod), trust-proxy, rate-limit, Zod validation, Winston logger, mock fallback (dev/test)
- **Auth:** `POST /auth/send-otp`, `verify-otp`, `send-magic-link`, `verify-magic-link`, `set-password`, `change-password`, `forgot-password`, `reset-password`, `GET /auth/me`, `POST /auth/admin-login` (email+password → ID token, auto-creates admin), `POST /auth/google` + `GET /me` auto-sync
- **Users:** `GET/PATCH /users/me`, `DELETE` soft, `GET /admin/users` etc.
- **Catalog:** `GET /products` (filters: `categoryId`, `search`, `isPopular`, `isRecommended`, `isVeg`, `limit`), `GET /products/:id`, `POST/PATCH` (admin); `GET /categories`; `GET /restaurants` + `/restaurant/default` + `/:id` (alias); `GET /offers`; `GET /home` aggregated; `GET /about`
- **Orders:** `POST/GET /orders` (user-scoped), `GET /orders/:id`, `PATCH /orders/:id/status` (admin), `GET /admin/orders` (all)
- **Addresses/Wishlist/Notifications/Tickets:** Full CRUD, user-scoped + admin views
- **Seed:** `POST/GET /seed` idempotent (8 products, 6 categories, 1 restaurant, 5 offers); `?force=true` requires admin; also `src/utils/seed.ts` CLI
- **Cart:** `GET /cart` 200 placeholder (client-persisted)
- **Mocks:** `src/services/mock/products.ts` removed — frontend is API-only; backend seeds Firestore; memory fallback only when `!isFirebaseConfigured()` or `NODE_ENV=test`

---

## 🧰 Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Expo 57.0.19, React 19.2.3, React Native 0.86.3, Expo Router 57, TypeScript 6.0.3, Firebase JS SDK 12, TanStack Query 5, Zustand 5, React Hook Form + Zod 4, Reanimated 4.5 + Worklets 0.10 + Gesture Handler 2.32, Safe Area 5.7, Screens 4.26, WebView 13.16, Vector Icons 15 |
| **Admin** | Vite 6, React 19.1, React Router 7, TypeScript 5.6, Tailwind 3, TanStack Query 5, Zustand 5, Axios 1, Recharts 2, Lucide, Sonner, RHF + Zod |
| **Backend** | Node 22+, Express 4, TypeScript 5.5, Firebase Admin 12, Zod 3, Helmet, CORS, express-rate-limit, Nodemailer 9, Winston, Jest + Supertest, tsx |
| **Infra** | Firebase Auth + Firestore, SMTP (your provider), EAS Build |

---

## 📁 Project Structure

```
food-ordering-app-react-native/   ← this repo (root)
├── fooody-frontend/              ← Expo customer app
│   ├── app/
│   │   ├── (auth)/welcome, login, signup, otp, magic-link, phone, set-password
│   │   ├── (tabs)/home, menu, offers, orders  + _layout (tabs + FloatingCart)
│   │   ├── cart/, checkout/, order/[id], product/[id], restaurant/, search, profile
│   │   ├── addresses/, admin/, favourites, wishlist, notifications, support/, about
│   │   └── _layout.tsx           ← Root stack + AuthGate + Reanimated logger
│   ├── src/
│   │   ├── api/{client, catalog.api, order.api, auth.api, admin.api, notification.api, ...}
│   │   ├── hooks/{useCatalog, useOrders, useWishlist, useNotifications, useTickets, ...}
│   │   ├── components/{TopBar, SearchBar, FloatingCart, FoodCard, CountryPicker, RecaptchaWebView, GreetingHeader, ...}
│   │   ├── store/{authStore, cartStore, wishlistStore, addressStore}
│   │   ├── services/{firebase, auth.service}
│   │   ├── theme/{colors, spacing, shadows, typography}
│   │   └── types/
│   ├── app.json                  ← Expo config (SDK 57)
│   ├── metro.config.js           ← PushNotificationIOS mock for Expo Go
│   └── package.json
├── fooody-admin/                 ← Vite admin dashboard
│   ├── src/
│   │   ├── pages/{Dashboard, Products, Categories, Popular, Offers, Orders, Customers, HomeContent, Settings, Profile, Login}
│   │   ├── api/{client, admin.api}
│   │   ├── layouts/AdminLayout, components/ui, store/authStore
│   │   └── types/
│   ├── vite.config.ts
│   └── package.json              ← dev: vite --port 5174
└── fooody-backend/               ← Express API
    ├── src/
    │   ├── config/{env, firebase, constants}
    │   ├── routes/{auth, user, product, category, restaurant, offer, home, order, address, wishlist, notification, ticket, admin, seed}
    │   ├── controllers, services, repositories, middleware, validators, utils/{seed, seed-data}
    │   └── __tests__
    ├── postman/
    └── package.json
```

---

## ✅ Prerequisites

- **Node.js 22.13+** (`node --version` — SDK 57 minimum)
- **npm 10+**
- **Firebase project** — https://console.firebase.google.com
- **Expo Go 57** on your phone — or iOS Simulator / Android Emulator / Web
- For physical device: phone + PC on **same Wi-Fi**

---

## 🔥 Firebase Setup (5 min)

1. **Create project** `foody-61bab` (or yours) → disable Analytics if you like.
2. **Firestore** → Build → Firestore Database → Create database → **Production mode** → region `asia-south1` (or closest) → collections auto-create (`users`, `products`, `categories`, `restaurants`, `offers`, `orders`, `addresses`, `otps`, `magicLinks`, `wishlists`, `notifications`, `tickets`, `banners`).
3. **Auth providers** → Build → Authentication → Get started → Sign-in method → enable:
   - **Email/Password** (required for OTP user creation + password flows)
   - **Phone** → enable → **Phone numbers for testing** → add `+919850939148` / code `789456`
   - **Google** → enable → note **Web SDK configuration → Web client ID** (`...apps.googleusercontent.com`)
   - **Settings → SMS region policy** → **Allow all regions** (otherwise `OPERATION_NOT_ALLOWED`)
   - **Settings → Authorized domains** → add `localhost` + your prod domain
4. **Service account** → Project Settings → Service accounts → **Generate new private key** → download JSON (never commit). Two ways to use:
   - **Local:** save as `fooody-backend/service-account.json`
   - **Prod (Vercel/Railway):** paste `project_id`/`client_email`/`private_key` into env vars

---

## 🔐 Environment Variables

### Backend `fooody-backend/.env` — copy from `.env.example`

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=*                           # prod: https://yourdomain.com

# Firebase Admin — Method 1 (local, recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
# Method 2 (prod) — leave empty when using file
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=your_service_account_email
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

MAGIC_LINK_REDIRECT_URL=foody://auth/magic-link  # prod: https://yourdomain.com/auth/magic-link
OTP_EXPIRATION_MINUTES=5
LOG_LEVEL=info

# Email (OTP / Magic Link) — configure your SMTP provider
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Your App Name
```

### Frontend `fooody-frontend/.env` — copy from `.env.example`

```env
# For Expo Go physical device use your PC LAN IP: http://192.168.1.x:5000/api/v1
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_MAGIC_LINK_REDIRECT=foody://auth/magic-link

# Firebase Web App — Project Settings → General → Your apps → Web app → Config
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google OAuth — Firebase Console → Auth → Sign-in method → Google → Web SDK configuration
# In Expo Go the Web ID works for iOS/Android; for native builds create iOS/Android OAuth clients
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id.apps.googleusercontent.com
```

### Admin `fooody-admin/.env` — copy from `.env.example`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> `.env` and `service-account.json` are gitignored. Commit only `.env.example`.

---

## 🚀 Installation

```bash
# Clone
git clone https://github.com/vishwajeetguru/food-ordering-app-react-native.git
cd food-ordering-app-react-native

# Backend
cd fooody-backend
npm install
copy .env.example .env   # then fill as above
# place service-account.json if using file method
npm run build            # verify
npm test                 # 28/28 should pass

# Frontend
cd ../fooody-frontend
npm install
copy .env.example .env   # then fill — see LAN IP note below

# Admin
cd ../fooody-admin
npm install
copy .env.example .env   # set VITE_API_URL
```

---

## ▶️ Running Locally

### 1. Backend

```bash
cd fooody-backend
npm run dev              # http://localhost:5000/health → {success:true}
# Seed Firestore (idempotent, public):
curl -X POST http://localhost:5000/api/v1/seed
# or with admin for force: curl -X POST http://localhost:5000/api/v1/seed?force=true -H "Authorization: Bearer <ADMIN_ID_TOKEN>"
```

> If Firestore was just created, wait 1-2 min after `Enable Firestore API` toggle.

### 2. Frontend

```bash
cd fooody-frontend
npx expo start --clear
# Scan QR with Expo Go (same Wi-Fi)
# Press `a` Android emulator, `i` iOS simulator, `w` web
```

**Physical device vs simulator:**

- **Simulator / web:** `EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1` works
- **Physical device (Expo Go):** use LAN IP — find it via `ipconfig` (Windows) / `ifconfig` (Mac) — e.g. `192.168.1.2` → `http://192.168.1.2:5000/api/v1` in `.env`, restart with `--clear`, allow **port 5000** through Windows Firewall:
  ```powershell
  # Run PowerShell as Administrator
  netsh advfirewall firewall add rule name="Foody Backend 5000" dir=in action=allow protocol=TCP localport=5000
  ```

### 3. Admin

```bash
cd fooody-admin
npm run dev              # http://localhost:5174
# Login: admin@foody.app / admin123 (also Admin123! for Firebase)
```

### 4. Test Flows

- **Email OTP:** Welcome → Create account → Email OTP → code from email (SMTP) → Verify → Set password → Home
- **Email + Password:** Signup/Login with password (requires Email/Password provider enabled)
- **Google:** Continue with Google → Firebase popup / expo-auth-session
- **Phone:** Continue with Phone → select country (search, no manual `+91`) → enter `9850939148` → code `789456` (test number) → reCAPTCHA auto (hidden WebView on native)
- **Catalog:** Home → Categories, Popular, Recommended, Offers → Menu tab (filter by category) → Product → Add to Cart → Floating cart → Cart → Checkout → Place Order (creates `POST /orders`) → Orders → Order detail
- **Admin:** Login → Dashboard (analytics charts) → Products/Categories/Offers/Popular CRUD → Orders status → Customers (role toggle) → Home Content (banners) → Settings

---

## 📬 API Docs

- **Health:** `GET /health` → `{success:true}`
- **Versioned base:** `/api/v1`
- **Postman:** import `fooody-backend/postman/Foody-Backend.postman_collection.json` + `Foody-Backend.postman_environment.json` (covers Auth OTP/Magic Link/Password/Google/Admin, Users, Products `?isPopular`/`isRecommended`/`isVeg`/`search`, Categories, Restaurants `/restaurants` + `/restaurant/default`, Offers, Home `/home`, Addresses, Wishlist, Notifications, Tickets, Orders, Seed, Cart)

Key endpoints:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/send-otp` | — | Send 6-digit email OTP |
| POST | `/api/v1/auth/verify-otp` | — | Verify OTP → `{customToken, uid}` |
| POST | `/api/v1/auth/send-magic-link` | — | Send magic link email |
| POST/GET | `/api/v1/auth/verify-magic-link` | — | Verify magic link |
| POST | `/api/v1/auth/set-password` | Bearer | Set password |
| POST | `/api/v1/auth/admin-login` | — | Admin login (auto-creates `admin@foody.app` if missing) |
| GET | `/api/v1/products?isPopular=true&limit=10` | — | Products (filters: categoryId, search, isPopular, isRecommended, isVeg) |
| GET | `/api/v1/categories` | — | Categories |
| GET | `/api/v1/restaurant/default` | — | Restaurant info |
| GET | `/api/v1/offers` | — | Active offers |
| GET | `/api/v1/home` | — | Aggregated home data |
| GET/POST | `/api/v1/orders` | Bearer | List / create orders |
| GET | `/api/v1/admin/analytics` | Admin | Dashboard analytics |
| POST | `/api/v1/seed` | — | Seed Firestore (idempotent) |

---

## 📦 Building for Production (EAS)

```bash
npm install -g eas-cli
# Frontend — update app.json bundle IDs, then:
cd fooody-frontend
eas build --platform android   # or ios / all
eas update                     # OTA (JS only, same runtime)

# Admin — static build:
cd ../fooody-admin
npm run build                  # → dist/

# Backend — deploy to Railway/Render/Vercel
# Set env vars: FIREBASE_* or GOOGLE_APPLICATION_CREDENTIALS, SMTP_*, CORS_ORIGIN=https://yourdomain.com, NODE_ENV=production
```

SDK 57 requires **Node 22.13+**, **Xcode 26.4+** (iOS 16.4+), **Android compile/target SDK 36**.

---

## 🛠 Troubleshooting

| Issue | Fix |
|---|---|
| `Network request failed` (Expo Go) | Use LAN IP in `EXPO_PUBLIC_API_URL`, same Wi-Fi, backend running, firewall allow 5000 |
| `Auth operation not allowed` | Firebase Console → Auth → Sign-in method → enable **Email/Password** |
| `OPERATION_NOT_ALLOWED : SMS unable` | Firebase Console → Auth → Settings → **SMS region policy → Allow all regions** |
| `iosClientId must be defined` | Add `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (= Web client ID works in Expo Go) |
| `Cloud Firestore API ... disabled` | Enable Firestore API: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=foody-61bab |
| `PushNotificationIOS` / `native module doesn't exist` (Expo Go) | Fixed via `metro.config.js` mock + `src/mocks/PushNotificationIOS.mock.js`; push uses mock tokens in Expo Go. For real push, create a dev build: `npx expo prebuild && npx expo run:ios` |
| `tsc` baseUrl deprecation (TS 6) | Already fixed via `ignoreDeprecations: 6.0` |
| Reanimated `strict` mode warning | Disabled via `configureReanimatedLogger({strict:false})` in `app/_layout.tsx:8` |
| Repeated `TOKEN_EXPIRED` / orders fail to load | Client auto-refreshes the ID token (single-flight) and retries once; fail-fast 8s timeout with Retry button. If it persists, logout/login once to reseed SecureStore |

---

## 🤝 Commercial Use & Support

This project is **free for personal and commercial use**. The only request:

- **DM me on Instagram before commercial use** — [instagram.com/vishwa__guru](https://www.instagram.com/vishwa__guru) — I can help tailor it for your needs.
- **Please ⭐ star this repo** — https://github.com/vishwajeetguru/food-ordering-app-react-native

Questions? DM on Instagram or open an issue.

---

## 📄 License

MIT — see `LICENSE` (Expo). You may use, modify, and distribute, including commercially, provided you retain the license notice and — per this project's additional request — **message the author on Instagram and star the repo**.

<p align="center">Made with ❤️ by <a href="https://www.instagram.com/vishwa__guru">Vishwa Guru</a></p>
