# Foody Backend 🍔

Single-restaurant food ordering backend built with **Node.js, Express, TypeScript, Firebase (Auth + Firestore), Firebase Admin SDK**.

Modular, secure, production-ready foundation for the **Foody** mobile app (Expo 54 + React Native).

> **Current scope:** Authentication + User foundation (`/api/v1/auth`, `/api/v1/users`).  
> Food domain (products, categories, cart, orders, payments…) is scaffolded as versioned placeholders and ready to extend cleanly.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Firebase Console Setup](#firebase-console-setup)
- [Environment Variables](#environment-variables)
- [Installation & Commands](#installation--commands)
- [Authentication Flows](#authentication-flows)
- [API Endpoints](#api-endpoints)
- [Response Format](#response-format)
- [Validation & Errors](#validation--errors)
- [Security](#security)
- [Expo App Integration](#expo-app-integration)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Architecture

```
Expo App (React Native)
    ↓  Authorization: Bearer <Firebase ID Token>
Foody Backend (Express + Firebase Admin)
    ↓
Firebase
  ├─ Authentication (Email/OTP, Magic Link, Google, Password)
  └─ Firestore (users, otps, magicLinks)
```

- **Versioned API:** `/api/v1`
- **Firebase Admin** verifies ID tokens, creates custom tokens, syncs Firestore user docs.
- **Provider-agnostic OTP:** `OTPProvider` → `EmailOTPProvider` (+ future `SmsOTPProvider`)
- **Mock mode:** If Firebase creds are missing, backend runs in mock/in-memory mode so `npm run dev` + `/health` work zero-config (ideal for local dev & CI).

---

## Prerequisites

- Node.js **≥18** (22 recommended, tested on 22.18.0)
- npm 10+
- Firebase project (https://console.firebase.google.com)

---

## Firebase Console Setup

### 1. Create project
1. Go to Firebase Console → **Add project** → name it `foody` (or similar).
2. Disable Google Analytics if not needed, or enable.

### 2. Enable Firestore
1. Build → **Firestore Database** → Create database.
2. Choose region closest to users (e.g., `asia-south1` for India).
3. Start in **production mode** (we enforce auth via Admin SDK; lock rules later).
4. Collections will be auto-created: `users`, `otps`, `magicLinks`.

### 3. Enable Authentication providers
1. Build → **Authentication** → Get started.
2. Sign-in method → enable:
   - **Email/Password** (required for password flows; also backs OTP/magic-link user creation)
   - **Google** (enable now; no extra config needed until Expo adds Google SDK)
   - **Email link (passwordless sign-in)** – optional, we implement our own magic link but enabling doesn't hurt.
3. Add authorized domains if you use web redirects.

### 4. Generate Admin Service Account
1. Project Settings → **Service accounts** → **Generate new private key** → download JSON.  
   *Do NOT commit this file.*
2. Two ways to use it:
   - **Local dev:** save as `E:\Projects\Mobile Applications\foody-backend\service-account.json` and set `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json` in `.env`
   - **Production:** copy `project_id`, `client_email`, `private_key` into `.env` (`FIREBASE_PROJECT_ID`, etc.) — see `.env.example`

### 5. (Optional) Firestore Rules – starter
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Admin SDK bypasses rules; clients never direct-access
    }
  }
}
```

---

## Environment Variables

Copy `.env.example` → `.env`:

```bash
copy .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `5000` | HTTP port |
| `CORS_ORIGIN` | `*` | `*` or comma-separated origins |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | — | Path to JSON file (local dev recommended) |
| `FIREBASE_PROJECT_ID` | — | Project ID (prod) |
| `FIREBASE_CLIENT_EMAIL` | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | — | Private key (preserve `\n`) |
| `MAGIC_LINK_REDIRECT_URL` | `foody://auth/magic-link` | Deep link / web URL user lands on after clicking magic link |
| `MAGIC_LINK_EXPIRATION_MINUTES` | `15` | Magic link TTL |
| `OTP_EXPIRATION_MINUTES` | `5` | OTP TTL |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60` | Cooldown between OTP sends |
| `OTP_MAX_ATTEMPTS` | `5` | Wrong OTP attempts before invalidating |
| `OTP_LENGTH` | `6` | Digits |
| `OTP_MAX_RESENDS_PER_HOUR` | `5` | Anti-abuse cap |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Generic limiter window (15m) |
| `RATE_LIMIT_MAX` | `100` | Requests per window |
| `LOG_LEVEL` | `info` | `debug`/`info`/`warn`/`error` |

> **Never commit** `.env`, `service-account.json`, `firebase-adminsdk*.json`.

---

## Installation & Commands

```bash
cd "E:\Projects\Mobile Applications\foody-backend"

npm install

# Development with auto-reload
npm run dev
# → http://localhost:5000/health
# → http://localhost:5000/api/v1

# Production
npm run build
npm start

# Type-check only
npm run lint

# Tests
npm test
npm run test:watch
```

Expected startup log:
```
🍔 Foody Backend
==================================================
Environment : development
Port        : 5000
Health      : http://localhost:5000/health
API Base    : http://localhost:5000/api/v1
Firebase    : connected  |  MOCK mode (configure .env to enable)
==================================================
```

---

## Authentication Flows

### Email OTP
```
Mobile App → POST /api/v1/auth/send-otp {email}
              → EmailOTPProvider sends/stores hash (5 min TTL, 60s cooldown, 5 attempts)
User enters OTP → POST /api/v1/auth/verify-otp {email, otp}
              → Backend: verify hash (timingSafeEqual), invalidate, findOrCreate Firebase user, createCustomToken
              → Response: { customToken, uid }
Mobile App → signInWithCustomToken(firebaseAuth, customToken)
              → Firebase returns ID Token
Mobile App → store ID token; every API call: Authorization: Bearer <idToken>
```

### Magic Link
```
Mobile App → POST /api/v1/auth/send-magic-link {email}
              → generate 32-byte token, store sha256 hash (15 min TTL, one-time use)
              → email contains https://.../api/v1/auth/verify-magic-link?token=...
User taps link → deep link opens app OR browser hits GET /verify-magic-link?token=...
              → Backend: hash verify, expire check, mark used, findOrCreate Firebase user, createCustomToken
              → JSON (API) or HTML success page (browser)
             → same customToken → signInWithCustomToken → ID token flow as OTP
Frontend URL is configurable via MAGIC_LINK_REDIRECT_URL
```

### Password (set up after OTP/magic link)
```
Authenticated user → POST /api/v1/auth/set-password {password}  (Bearer ID token)
                   → Firebase Admin updateUser(uid, {password}) + mark hasPassword true
Authenticated     → POST /api/v1/auth/change-password {newPassword}
Unauthenticated   → POST /api/v1/auth/forgot-password {email}
                   → Admin generatePasswordResetLink(email)  (exposed in dev; emailed in prod)
Client SDK reset  → POST /api/v1/auth/reset-password {oobCode, newPassword}
                   → Note: prefer Firebase client SDK confirmPasswordReset(oobCode, newPassword)
```

### Google (architecture ready, no backend redesign needed)
```
Expo App → expo-auth-session / @react-native-google-signin → Firebase signInWithCredential(Google)
         → Firebase ID token
         → Authorization: Bearer <idToken> to any authenticated endpoint
Backend  → authenticate middleware verifyIdToken → sync user doc (providers includes "google")
Optional → POST /api/v1/auth/google {idToken} for explicit sync
```
Fields already present: `providers: ["google"]`, `emailVerified`, `role`, etc.

---

## API Endpoints

Base: `http://localhost:5000` (or `https://your-domain.com`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ❌ | Liveness probe |
| `GET` | `/` | ❌ | API info |
| `POST` | `/api/v1/auth/send-otp` | ❌ | Send Email OTP |
| `POST` | `/api/v1/auth/verify-otp` | ❌ | Verify OTP → customToken |
| `POST` | `/api/v1/auth/send-magic-link` | ❌ | Send magic link |
| `GET` | `/api/v1/auth/verify-magic-link?token=...` | ❌ | Verify magic link (browser/deep link) |
| `POST` | `/api/v1/auth/verify-magic-link` | ❌ | Verify magic link (JSON) |
| `POST` | `/api/v1/auth/set-password` | ✅ | Set password for current user |
| `POST` | `/api/v1/auth/change-password` | ✅ | Change password |
| `POST` | `/api/v1/auth/forgot-password` | ❌ | Request password reset link |
| `POST` | `/api/v1/auth/reset-password` | ❌ | Reset via oobCode (advises client SDK) |
| `GET` | `/api/v1/auth/me` | ✅ | Current authenticated user (via Firebase token) |
| `POST` | `/api/v1/auth/logout` | ✅ | Stateless logout guidance |
| `POST` | `/api/v1/auth/google` | ❌/✅ | Google placeholder / verify |
| `GET` | `/api/v1/users/me` | ✅ | Get profile |
| `PATCH` | `/api/v1/users/me` | ✅ | Update profile (name, phone, profileImage, preferences) |
| `DELETE` | `/api/v1/users/me` | ✅ | Soft-delete account |
| `GET` | `/api/v1/products` | — | Placeholder 501 (foundation ready) |
| `GET` | `/api/v1/categories` | — | Placeholder |
| etc. | `/cart`, `/orders`, `/addresses`, `/payments` | — | Placeholders |

### Request Examples

**Send OTP**
```http
POST /api/v1/auth/send-otp
Content-Type: application/json
{ "email": "user@example.com" }
```
Response `200`:
```json
{ "success": true, "message": "OTP sent successfully", "data": { "expiresAt": "2026-09-02T..." } }
```

**Verify OTP**
```http
POST /api/v1/auth/verify-otp
{ "email": "user@example.com", "otp": "123456" }
```
Response `200`:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": { "uid": "abc123", "email": "user@example.com", "customToken": "eyJ...", "isNewUser": false }
}
```

**Update profile**
```http
PATCH /api/v1/users/me
Authorization: Bearer <idToken>
{ "name": "John Doe", "phone": "+919876543210" }
```

---

## Response Format

**Success**
```json
{ "success": true, "message": "User retrieved successfully", "data": {} }
```

**Error**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "error": { "code": "INVALID_OTP", "details": { "remaining": 3 } }
}
```

HTTP codes: `200`, `400`, `401`, `403`, `404`, `422`, `429`, `500`, `501`.

**Error codes** (`ERROR_CODES` in `src/config/constants.ts`): `INVALID_OTP`, `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS_EXCEEDED`, `OTP_RESEND_COOLDOWN`, `INVALID_MAGIC_LINK`, `MAGIC_LINK_EXPIRED`, `MAGIC_LINK_ALREADY_USED`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `FORBIDDEN`, `USER_NOT_FOUND`, etc.

---

## Validation & Errors

- **Zod** schemas in `src/validators/`.
- Centralized error middleware: operational vs programming errors separated; stack traces hidden in production.
- Sensitive fields (`password`, `otp`, `token`) sanitized from logs.

---

## Security

- `helmet`, `cors` (configurable origins), `express-rate-limit` (generic + strict auth/OTP limiters)
- Firebase ID token verification per request
- OTP: `crypto.randomInt`, `sha256` hashed storage, `timingSafeEqual` compare, expiry, max attempts, resend cooldown, hourly cap, single-use invalidation, rate-limited endpoint
- Magic link: 32-byte `randomBytes`, sha256 hash storage, expiry, one-time use (`used` flag), replay protection
- No plain-text passwords (delegated to Firebase Auth), no secrets in repo, no OTPs/magic tokens in prod logs
- Centralized `validate` middleware, no stack traces in prod responses

---

## Expo App Integration

```ts
// 1. Send OTP
await fetch(`${API}/api/v1/auth/send-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});

// 2. Verify OTP → get customToken
const r = await fetch(`${API}/api/v1/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, otp }),
});
const { customToken } = (await r.json()).data;

// 3. Exchange for Firebase ID token (using Firebase JS SDK in Expo)
import { signInWithCustomToken } from 'firebase/auth';
const cred = await signInWithCustomToken(auth, customToken);
const idToken = await cred.user.getIdToken();

// 4. Call authenticated endpoints
await fetch(`${API}/api/v1/users/me`, {
  headers: { Authorization: `Bearer ${idToken}` },
});

// 5. Magic link deep linking
// Configure in app.json: scheme "foody", handle incoming URL foody://auth/magic-link?token=...
// Extract token, then POST /api/v1/auth/verify-magic-link { token } → customToken → same exchange

// 6. Google (later)
// After Google + Firebase sign-in in Expo, just reuse idToken as Bearer token – backend auto-syncs user doc.
```

Password setup after OTP:
```ts
await fetch(`${API}/api/v1/auth/set-password`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'StrongPass1' }),
});
```

---

## Testing

```bash
npm test
```

Coverage includes:
- `GET /health`
- OTP generation & verification (success, expired, wrong OTP, reuse, attempt limit, cooldown)
- Magic link expiry & reuse
- Authenticated endpoint with valid/invalid/missing Firebase token
- User creation & retrieval sync
- Validation errors

Tests run against in-memory repositories (no Firebase credentials required) by setting `NODE_ENV=test` (mock token `test-token-<uid>` helper).

---

## Project Structure

```
foody-backend/
├── src/
│   ├── config/          # env, firebase, constants
│   ├── controllers/     # auth, user
│   ├── routes/          # auth.routes, user.routes, index (versioned)
│   ├── services/        # auth, user, otp/service + providers, magic-link
│   ├── repositories/    # user, otp, magic-link (Firestore + memory fallback)
│   ├── middleware/      # auth, error, rate-limit, validate
│   ├── validators/      # zod schemas
│   ├── utils/           # response, errors, logger, crypto
│   ├── types/           # user, auth, express augmentation
│   ├── __tests__/       # jest tests
│   ├── app.ts
│   └── server.ts
├── docs/
│   └── API.md
├── .env.example
├── package.json
└── tsconfig.json
```

**Extending:** Add food modules under `src/routes`, `src/controllers`, `src/services`, `src/repositories` and mount in `src/routes/index.ts`. Replace placeholder `501` handlers.

---

## Next Steps before connecting Expo 54

1. Fill `.env` or place `service-account.json`.
2. `npm install && npm run dev` → confirm `GET /health` returns `success:true`.
3. Create first test OTP flow (see Authentication Flows) – in dev the OTP appears in console: `[DEV] Email OTP for ...`.
4. In Expo, `npm install firebase`, init with same Firebase project web config, then use `signInWithCustomToken` as shown.
5. Set `MAGIC_LINK_REDIRECT_URL` to your Expo deep link (`foody://auth/magic-link`) – test via `POST /send-magic-link` and copying the dev link.
6. Replace console email provider with real transporter (nodemailer/SES/SendGrid) before production.

---

Built for **Foody – single-restaurant ordering**. No marketplace logic. Scales to: categories, products, cart, orders, payments, coupons, tracking, notifications, admin.

