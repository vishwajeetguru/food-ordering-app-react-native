# Foody — Premium Food Ordering App (Expo 54)

Single-restaurant food ordering customer app — premium UI inspired by Zomato/Swiggy but **original** branding/design — built with **Expo SDK 54 + React Native 0.81 + TypeScript + Expo Router + Firebase + TanStack Query + Zustand + React Hook Form + Zod + Reanimated**.

Backend: `E:\Projects\Mobile Applications\foody-backend` (Node/Express/Firebase, mock mode supported).

---

## Quick Start

```bash
cd "E:\Projects\Mobile Applications\fooody"

# 1) Env
copy .env.example .env
# Edit .env: set EXPO_PUBLIC_API_URL to your backend
# - Simulator/emulator: http://localhost:5000/api/v1
# - Physical device: http://YOUR_LAN_IP:5000/api/v1  (e.g. 192.168.1.5)
# Optional Firebase web config (if empty, app runs fully on backend mock tokens)

# 2) Install (already done)
npm install

# 3) Run
npx expo start
#  → Scan QR with Expo Go (Android/iOS)
#  → Press `a` for Android emulator, `i` for iOS simulator, `w` for web

# Backend must be running in parallel:
cd "E:\Projects\Mobile Applications\foody-backend"
npm run dev  # -> http://localhost:5000/health
```

**Verified:** `Expo 54.0.37`, `React 19.1.0`, `React-Native 0.81.5`, `expo-doctor 18/18 checks passed`, `tsc --noEmit` clean, Metro `http://localhost:19000` responds 200. Backend `GET /health` returns `success:true`.

---

## Project Structure

```
fooody/
├── app/
│   ├── _layout.tsx              # Root: QueryClient + GestureHandler + SafeArea + StatusBar + AuthGate
│   ├── index.tsx                # Redirect: (auth)/welcome vs (tabs)/home
│   ├── (auth)/_layout.tsx
│   │   ├── welcome.tsx          # Foody hero, Google placeholder, Continue with Email
│   │   ├── login.tsx            # Email/Password + Google + OTP + Magic Link + Forgot
│   │   ├── signup.tsx           # Name+Email → send OTP
│   │   ├── otp.tsx              # 6-digit auto-focus, paste, resend countdown, error animations
│   │   ├── magic-link.tsx       # Email → send link → deep link foody://auth/magic-link?token=
│   │   └── set-password.tsx     # Password+Confirm → setPassword (hasPassword flag)
│   ├── (tabs)/_layout.tsx       # Premium tab bar (icons + cart badge)
│   │   ├── home.tsx             # Greeting, Delivering to, Search, Banner, Categories, Popular, Recommended, Offers, Restaurant CTA, Floating Cart
│   │   ├── search.tsx           # Input + debounce (300ms), recent, categories, results, empty
│   │   ├── orders.tsx           # Active/Past tabs, OrderCard + tracker deep-link
│   │   └── profile.tsx          # Avatar, email, My Orders/Addresses/Favorites/Help, Logout
│   ├── restaurant/index.tsx     # Hero image, logo, rating, sticky categories, product grid
│   ├── product/[id].tsx         # Large image, price, size/add-ons/quantity, Add to Cart (reanimated)
│   ├── cart/index.tsx           # Items + qty +/- animation, subtotal/delivery/tax/discount/total, Proceed to Checkout
│   ├── checkout/index.tsx       # Address, Contact, Order Summary, Coupon, COD + Online (abstraction, soon)
│   └── order/[id].tsx           # Animated status tracker (Placed→Delivered)
├── src/
│   ├── theme/colors.ts, typography.ts, spacing.ts, shadows.ts
│   ├── components/ui/Button.tsx, Input.tsx, Card.tsx, Skeleton.tsx
│   ├── components/FoodCard.tsx, OTPInput.tsx
│   ├── api/client.ts            # centralized fetch, Authorization: Bearer <idToken>
│   ├── api/auth.api.ts          # authApi, userApi, productApi/categoryApi placeholders
│   ├── services/firebase.ts     # getFirebaseApp/Auth, isFirebaseConfigured guard
│   ├── services/auth.service.ts # sendOtp/verifyOtp (customToken→idToken exchange or mock), magicLink, setPassword, logout, restore
│   ├── services/mock/products.ts# mockCategories, mockProducts (8), restaurant, offers
│   ├── store/authStore.ts       # zustand: user, idToken, restore, refreshUser, logout
│   ├── store/cartStore.ts       # zustand persist (AsyncStorage): add/inc/dec/remove/clear/subtotal/count
│   ├── hooks/useAuth.ts, useDebouncedSearch.ts
│   ├── types/index.ts           # User, Product, Category, CartItem, Order, Address, ApiResponse
│   └── constants/config.ts      # EXPO_PUBLIC_API_URL, scheme
├── assets/
├── .env.example, .env
├── app.json (scheme: foody, plugins: expo-router, expo-secure-store, expo-font)
├── babel.config.js (reanimated/plugin last)
├── tsconfig.json (paths @/* → src/*)
└── package.json
```

---

## Environment Variables

```env
# .env.example
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_MAGIC_LINK_REDIRECT=foody://auth/magic-link

# Firebase web app config (Firebase Console > Project Settings > Web App)
# Leave empty for mock mode — backend mock tokens (customToken as Bearer) will be used
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

For physical device: replace `localhost` with LAN IP + ensure `foody-backend` `.env` has `CORS_ORIGIN=*` and `MAGIC_LINK_REDIRECT_URL=foody://auth/magic-link`.

---

## Firebase Configuration Steps

1. Firebase Console → Add project `foody` → Enable **Authentication** → Sign-in methods: `Email/Password`, `Google` (enable, no OAuth client needed yet), `Email link`.
2. Project Settings → General → **Your apps** → Web app → copy `firebaseConfig` → paste into `fooody/.env` `EXPO_PUBLIC_FIREBASE_*`.
3. Project Settings → Service accounts → Generate private key for `foody-backend` → set in backend `.env` (`FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_*`).
4. No additional mobile OAuth setup needed until real Google sign-in is implemented (button is placeholder, see `app/(auth)/welcome.tsx:18 handleGoogle` shows Alert).

---

## Backend Connection

- Client: `src/api/client.ts:14` `setAuthToken(token)` + `Authorization: Bearer <token>` on every request.
- Server: `foody-backend/src/middleware/auth.middleware.ts:8` `authenticate` verifies Firebase ID token or mock `test-token-<uid>` / base64 mock customToken.
- Env: `src/constants/config.ts:6` reads `EXPO_PUBLIC_API_URL` (never hardcoded elsewhere). Example: `api.post('/auth/verify-otp', ...)` → `${apiUrl}/auth/verify-otp`.
- Already connected: `authApi`/`userApi` (`src/api/auth.api.ts`). Future `productApi` etc are typed stubs returning mock until backend implements `/products` etc (both sides use same `Product` interface so no rewrite needed).

Test backend before app:
```bash
curl http://localhost:5000/health
# Postman: import foody-backend/postman/Foody-Backend.postman_collection.json (27 requests, collection variables, auto-saves customToken→idToken)
```

---

## Authentication Flow

```
Welcome → Continue with Email → Login (Email+Password) or Signup (Name+Email)
Signup → POST /auth/send-otp → 6-digit email OTP (backend console [DEV] Email OTP in mock / real email in prod, 5min TTL, 60s cooldown, 5 attempts)
       → OTP screen (paste, auto-focus, resend countdown, error states: invalid/expired/limit)
       → POST /auth/verify-otp → {customToken, uid}
       → auth.service: try firebase signInWithCustomToken → idToken; fallback mock customToken as Bearer
       → Set Password (optional) → POST /auth/set-password (Bearer) → marks hasPassword
       → (tabs)/home (AuthGate)

Login alternatives:
  Use Email OTP → magic-link-like OTP flow
  Use Magic Link → POST /auth/send-magic-link → email link ?token= (sha256, 15min, one-time) → foody://auth/magic-link?token= → app/(auth)/magic-link parses token via ExpoLinking + query param → POST /auth/verify-magic-link → same token exchange

Password Login:
  Email+Password → firebase signInWithEmailAndPassword → idToken → Bearer

Google:
  UI present (welcome.tsx + login.tsx), service throws GOOGLE_NOT_IMPLEMENTED, Alert "will be available soon" — abstraction ready so adding Google requires only wiring @react-native-google-signin → firebase credential, no backend redesign (backend auto-syncs providers: ["google"])

Session:
  SecureStore TOKEN_KEY 'foody_id_token' persisted, _layout AuthGate restores on launch, refreshUser() fetches /users/me, logout clears store + SecureStore + firebase signOut.
```

Deep linking: `app.json:5 scheme:"foody"` + `expo-linking` parses `foody://auth/magic-link?token=...` in `app/(auth)/magic-link.tsx:20` (`ExpoLinking.addEventListener('url')` + `useLocalSearchParams`).

---

## Design System

- **Colors** (`src/theme/colors.ts`): `primary #FF5A3D`, `primaryDark`, `primaryLight/Muted`, `accent #FFB020`, warm off-white `background #FFFDFB`, `surface`, `border`, `success/warning/error`, `veg/nonVeg`, `overlay`. WCAG AA.
- **Typography** (`typography.ts`): `displayLarge/Medium`, `h1-h4`, `body/bodySmall`, `label/labelSmall`, `caption`, `priceLarge/price`. Weights 400-800, tight letter-spacing.
- **Spacing/radius/shadows** (`spacing.ts`, `shadows.ts`): 4pt grid (`xs 4`…`6xl 64`), `radius md 12`/`lg 16`/`xl 20`, iOS shadow + Android elevation presets (`xs, sm, md, lg, floating`).
- **Animations**: `react-native-reanimated` 4.1.1 (worklets installed), `withSpring` for pressing, `FadeInUp` for screens/cards, skeleton shimmer `withRepeat(withTiming)`, quantity ticker, add-to-cart scaling, tab transitions, bottom sheets ready.
- **Icons**: Text/emoji placeholders + generic circles (replace with `expo-vector-icons` or SVG as needed; no Zomato asset reuse).

---

## Loaded, Error & Empty States

- Every API screen has: `<Skeleton>` shimmer (`src/components/ui/Skeleton.tsx`), pull-to-refresh (`RefreshControl`), `Button loading/disabled`, retry, plus empty states (Search no results, Cart empty, Orders empty, Recent).
- Global error handling: `src/api/client.ts:24` throws `{status, code, details}`; callers `Alert` with `code` (`INVALID_OTP`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS_EXCEEDED`, `MAGIC_LINK_EXPIRED`, `UNAUTHORIZED`, `RATE_LIMITED`, etc.); 401 routes redirect to login via AuthGate; network error → "No internet connection. Please check and try again."
- Validation: `react-hook-form` + `zodResolver` on every form (email regex, name min 2, OTP digits, password 8+ upper/lower/digit, phone E.164 on profile patch). Errors shown inline under `Input`.

---

## Responsive & A11y

- `useWindowDimensions` for card grid (`(width - padding*2 - gap)/2`), no fixed widths; `SafeAreaView` everywhere; responsive spacing via `spacing` tokens; density-agnostic images (`expo-image` with `contentFit="cover"`).
- A11y: `accessibilityLabel`/`accessibilityRole="button"` on `Button`/Pressables (e.g., `FoodCard` add, OTP boxes), touch targets ≥44pt (`hitSlop`), contrast AA, keyboard handling (`keyboardShouldPersistTaps`, `autoCapitalize`, `returnKeyType`), screen-reader labels.

---

## Performance

- `FlatList` for categories/products/search results (`horizontal`, `keyExtractor`, `showsHorizontalScrollIndicator:false`); images via `expo-image` (cached, transition); TanStack Query caching (`staleTime 60s`); Reanimated worklets on UI thread; `zustand` selective selectors (`useCartStore(s=>s.items.reduce…)`) to avoid re-renders; no huge lists — pagination ready.

---

## Mock vs Real API

- `src/services/mock/products.ts` provides **typed mock** that mirrors future backend payloads. Components consume `Product`/`Category` interfaces directly, so switching is one-line in `src/api/auth.api.ts:30` (`productApi.list = () => api.get('/products')`). Cart persisted via `zustand` + `AsyncStorage` (`createJSONStorage`) so works offline.

---

## How to Run (again, verbatim required)

```bash
npx expo start
```

- Requires `foody-backend` on `http://localhost:5000` (or LAN IP) — see backend `npm run dev` + `GET /health` check.
- First launch shows `(auth)/welcome`; after signup/login you are routed to `(tabs)/home`.

---

## Android Testing

1. Ensure `adb` works: `adb devices` (or open Android Studio emulator).
2. `npx expo start` → press `a` → opens on emulator. Or Expo Go: install Expo Go from Play Store → scan QR from terminal → grant permissions.
3. For physical device, backend `EXPO_PUBLIC_API_URL` must be `http://YOUR_PC_LAN_IP:5000/api/v1` (not `localhost`); both device and PC on same Wi-Fi; backend `CORS_ORIGIN=*`.

## iOS Testing

- **Expo Go (no Mac needed)**: Install Expo Go from App Store → `npx expo start` → scan QR with Camera → opens in Expo Go. Push notifications/deep links work via `foody://`.
- **Simulator (Mac only)**: `npx expo start` → press `i` → builds in iOS simulator.
- Physical iPhone: same LAN IP note as Android; iOS may require `NSAppTransportSecurity` already handled by Expo.

---

## Remaining Configuration Before Production

- Fill `fooody/.env` Firebase web config and `foody-backend/.env` service account (or keep mock for local dev).
- Replace placeholder food images (Unsplash) with your licensed assets.
- Plug real email transporter in backend (`EmailOTPProvider`) — currently console logs OTP in dev; Postman collection shows `magicToken` handling.
- Implement real Google Sign-In (`@react-native-google-signin/google-signin` + `GoogleAuthProvider` credential) — UI/service already abstracted.
- Add `expo-secure-store` encryption check for production; consider `react-native-keychain` if required.
- Configure `app.json:ios.bundleIdentifier / android.package` for EAS Build (`eas build`).
- Set `MAGIC_LINK_REDIRECT_URL` in backend `.env` to production deep link (`https://yourapp.com/auth/magic-link` + `foody://` fallback).

---

**Expo SDK**: `54.0.37` (confirmed `expo --version 54.0.27`, `expo-doctor 18/18`). **Installed packages**: see `package.json:5` (expo 54, expo-router 6.0.24, reanimated 4.1.1, worklets, gesture-handler, safe-area, screens, expo-image/blur/linear-gradient/haptics, firebase 12.18, tanstack-query 5.102, zustand 5.0, react-hook-form 7.87, zod 4.5, async-storage 2.2).
