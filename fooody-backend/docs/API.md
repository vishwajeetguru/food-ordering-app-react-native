# Foody API Documentation

Base URL: `http://localhost:5000`  
Versioned prefix: `/api/v1`

All responses use the standard envelope:

```json
// success
{ "success": true, "message": "...", "data": {} }
// error
{ "success": false, "message": "...", "error": { "code": "VALIDATION_ERROR", "details": {} } }
```

---

## Health

```
GET /health
GET /
```
No auth. Used for monitoring / load balancer.

**200**
```json
{ "success": true, "message": "Foody backend is running", "data": { "uptime": 123, "timestamp": "...", "environment": "development" } }
```

---

## Auth

### POST /api/v1/auth/send-otp
Body:
```json
{ "email": "user@example.com", "channel": "email" }
```
- `channel` defaults to `email`; `sms` is placeholder (throws not-implemented).
- Rate limited: 10/hr/IP, cooldown 60s.
- Errors: `OTP_RESEND_COOLDOWN`, `OTP_RATE_LIMITED`, `VALIDATION_ERROR`.

**200**
```json
{ "success": true, "message": "OTP sent successfully", "data": { "expiresAt": "2026-09-02T..." } }
```
In dev, OTP is logged: `[DEV] Email OTP for user@example.com: 123456`.

### POST /api/v1/auth/verify-otp
Body:
```json
{ "email": "user@example.com", "otp": "123456" }
```
Checks expiry, timingSafeEqual hash, attempts, single-use.

**200**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": { "uid": "...", "email": "user@example.com", "customToken": "eyJ...", "isNewUser": true }
}
```
Errors: `OTP_NOT_FOUND`, `INVALID_OTP`, `OTP_EXPIRED`, `OTP_ALREADY_USED`, `OTP_MAX_ATTEMPTS_EXCEEDED`.  
Next: `signInWithCustomToken(auth, customToken)` → `getIdToken()`.

### POST /api/v1/auth/send-magic-link
Body:
```json
{ "email": "user@example.com" }
```
Generates 32-byte token, stores hash, Link = `${MAGIC_LINK_REDIRECT_URL}?token=...&email=...`.

**200**
```json
// development
{ "success": true, "message": "Magic link sent successfully", "data": { "expiresAt": "...", "link": "foody://auth/magic-link?token=..." } }
// production
{ "success": true, "message": "Magic link sent successfully", "data": { "expiresAt": "...", "message": "Magic link sent to email if account exists" } }
```

### GET /api/v1/auth/verify-magic-link?token=xxx
Also `POST /api/v1/auth/verify-magic-link` with `{ token }`.  
Browser request with `Accept: text/html` returns HTML success page.

**200 JSON**
```json
{ "success": true, "message": "Magic link verified successfully", "data": { "uid": "...", "email": "...", "customToken": "..." } }
```
Errors: `INVALID_MAGIC_LINK`, `MAGIC_LINK_ALREADY_USED`, `MAGIC_LINK_EXPIRED`.

### POST /api/v1/auth/set-password
Auth required (`Bearer <idToken>`).
Body: `{ "password": "StrongPass1" }`
- Min 8, need upper/lower/digit.
- Delegates to `admin.auth().updateUser(uid, {password})`, marks `hasPassword:true`.

### POST /api/v1/auth/change-password
Auth required.
Body: `{ "newPassword": "NewStrong1" }`
Same semantics; re-auth should be done client-side if needed.

### POST /api/v1/auth/forgot-password
Body: `{ "email": "user@example.com" }`
Calls `admin.auth().generatePasswordResetLink(email)`; in dev returns link (so you can test without email infra); in prod masks existence (`If an account...`).

### POST /api/v1/auth/reset-password
Body: `{ "oobCode": "...", "newPassword": "NewStrong1" }`
> **Advisory:** This endpoint currently instructs to use Firebase Client SDK `confirmPasswordReset`. Admin SDK cannot verify `oobCode` server-side; full reset should be client-side. Kept for completeness and to surface a clear error code.

### GET /api/v1/auth/me
Auth required. Returns Firestore-synced user.

### POST /api/v1/auth/logout
Auth required. Stateless – tells client to discard tokens.

### POST /api/v1/auth/google
Body: `{ "idToken": "firebase Google idToken" }` – or no body for architecture info.
Verifies `idToken`, ensures user doc with `providers: ["google"]`.

---

## Users

All require `Authorization: Bearer <Firebase ID token>`.

### GET /api/v1/users/me
**200**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "firebase_uid",
    "email": "user@example.com",
    "phone": null,
    "name": null,
    "profileImage": null,
    "providers": ["email_otp"],
    "emailVerified": true,
    "phoneVerified": false,
    "hasPassword": false,
    "role": "customer",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### PATCH /api/v1/users/me
Body (all optional): `{ "name": "John", "phone": "+919876543210", "profileImage": "https://...", "preferences": { "notifications": true } }`
- Validates `phone` as E.164, `name` 2–50 chars, `profileImage` URL.

### DELETE /api/v1/users/me
Soft-deletes (status `deleted`) + disables Firebase auth user if configured.

---

## Products

Public reads, admin writes. **Synced to frontend `src/services/mock/products.ts` — 8 seeds (p1-p8) backend is source of truth.**

### GET /api/v1/products
Query: `?categoryId=1&limit=20&search=pizza&isPopular=true&isRecommended=true&isVeg=true` — all optional.
- `categoryId` filters by category (1=Pizza, 2=Burgers, 3=Biryani, 4=Chinese, 5=Desserts, 6=Beverages)
- `search` case-insensitive in `name`, `description`, **and `categoryName`** (so `search=Chinese` → p5 Hakka Noodles). In-memory when Firestore can't text search.
- `isPopular`/`isRecommended`/`isVeg` boolean filters (`?isPopular=true` → p1,p2,p4; `?isRecommended=true` → p1,p3,p6; `?isVeg=false` → p3,p4). Avoids composite index by in-memory post-sort.
- `limit` default 20, max 100
- Sorted by rating desc
- Public, no auth. Returns seeded **8 products** in mock/memory or Firestore (p1 Margherita Supreme 4.6★, p2 Truffle Mushroom 4.8★, p3 BBQ Burger 4.5★, p4 Biryani 4.7★, p5 Hakka Noodles 4.3★, p6 Brownie 4.9★, p7 Cold Coffee 4.4★, p8 Paneer Tikka Pizza 4.6★).

**200** `{ success:true, data:[{id, name, price, image, rating, categoryId, isPopular, isRecommended, prepTime, ...}] }`

### GET /api/v1/products/:id
Public. 404 `NOT_FOUND` if missing.

### POST /api/v1/products
Auth + `requireRole('admin')`. Body:
```json
{ "name":"Paneer Tikka Pizza", "description":"...", "price":399, "image":"https://...", "categoryId":"1", "isVeg":true, "isPopular":true, "isRecommended":false, "prepTime":"25-30 min", "categoryName":"Pizza" }
```
- `name` min 2, `description` min 5, `price` positive, `image` URL, `categoryId` required.
- Optional: `isPopular`, `isRecommended`, `prepTime`, `categoryName`, `tags`, `images`.
- Generates `id: p_<timestamp>` if not provided.
- 401 if no token, 403 if not admin.

### PATCH /api/v1/products/:id
Auth + admin. Partial update (any field). 404 if not found.

---

## Categories

Public only (no writes yet).

### GET /api/v1/categories
Public. Returns 6 seeded categories (Pizza, Burgers, Biryani, Chinese, Desserts, Beverages) in mock.

### GET /api/v1/categories/:id
Public. Returns 404-style envelope with `null` data if missing (per controller).

---

## Restaurants

Single-restaurant architecture (Foody House) — public reads. Seeded from frontend `restaurant` mock.

### GET /api/v1/restaurants
List (always 1 doc: `r1`). Public.

**200** `{ success:true, data:[{ id:"r1", name:"Foody House", image:"...", logo:"...", rating:4.8, ratingCount:1240, deliveryTime:"25-35 min", priceForTwo:600, cuisines:["Italian","North Indian","Chinese"], about:"..." }] }`

### GET /api/v1/restaurants/:id
Public. `GET /restaurants/r1` or alias `GET /restaurant/r1` or `GET /restaurant/default` (convenience single). 404 if missing.

---

## Offers

Public reads. Seeded from frontend `offers` mock (2).

### GET /api/v1/offers
List 2 offers: `o1 FLAT 20% OFF` (code `FOODY20`, color `#FF5A3D`) and `o2 FREE DELIVERY` (code `FREESHIP`, `#16A34A`).

**200** `{ success:true, data:[{id:"o1", title:"FLAT 20% OFF", subtitle:"on orders above ₹499", color:"#FF5A3D", code:"FOODY20"}, ...] }`

### GET /api/v1/offers/:id
Public. `GET /offers/o1`. 404 if missing.

---

## Home (Aggregated)

Convenience for frontend `Home` screen which previously sliced `mockProducts.slice(0,4)` for Popular and `slice(4,6)` for Recommended.

### GET /api/v1/home
Public. Aggregates in parallel:

**200**
```json
{
  "success": true,
  "data": {
    "restaurant": { "id":"r1", "name":"Foody House", ... },
    "offers": [{ "id":"o1", ... }, { "id":"o2", ... }],
    "categories": [{ "id":"1", "name":"Pizza", ... }, ...6],
    "popular": [{ "id":"p2", ... }, { "id":"p4", ... }, { "id":"p1", ... }], // isPopular=true, sorted rating
    "recommended": [{ "id":"p6", ... }, { "id":"p1", ... }, { "id":"p3", ... }] // isRecommended=true
  }
}
```

---

## Seed & Maintenance

Idempotent DB seeding from frontend mock (8 products, 6 categories, 1 restaurant, 2 offers). Auto-runs on server startup if Firebase configured (`src/server.ts` + `src/utils/seed.ts`), plus manual.

### POST /api/v1/seed
Public idempotent — inserts missing seed docs (per-id check, `merge:true`). No auth needed for dev.

**200** `{ success:true, data:{ products:0|4, categories:0, restaurants:0, offers:0 } }` — 0 means already has all seeds.

### GET /api/v1/seed
Same as POST (alias).

### POST /api/v1/seed?force=true
Force overwrite all seeds (admin only, `requireRole('admin')` via `/seed/force` alias). 403 if not admin.

---

## Addresses

All require `Authorization: Bearer <idToken>`.

### GET /api/v1/addresses
List addresses for `userId`. Auth required.

### POST /api/v1/addresses
Body:
```json
{ "label":"Home", "address":"123 MG Road, Bengaluru 560034", "details":"Near Forum Mall", "lat":12.9, "lng":77.6 }
```
- `label` enum `Home|Work|Other` required
- `address` 5–300 chars required
- `details` max 300 optional, `lat`/`lng` optional numbers

**201** `{ success:true, data:{id, userId, label, address, ...} }`

### PATCH /api/v1/addresses/:id
Partial update, must own address. 404 if not found/not owned.

### DELETE /api/v1/addresses/:id
Must own. 404 if not found/not owned.

---

## Orders

All require auth. Status update requires admin.

### GET /api/v1/orders
List for `userId`, `?limit=20` default. Sorted `createdAt` desc.

### POST /api/v1/orders
Body:
```json
{
  "items":[{"productId":"p1","name":"Margherita Supreme","price":349,"quantity":2}],
  "subtotal":698, "deliveryFee":40, "tax":50, "discount":0, "total":788,
  "paymentMethod":"cod", "address":{"label":"Home","address":"123 MG Road"}
}
```
- `items` array required, non-empty; `total` etc default 0 if missing; `paymentMethod` `cod|online` default `cod`.
- Returns `{id, orderNumber:"ORD-..."}`

**201**

### GET /api/v1/orders/:id
Auth required, ownership check (`userId` matches or `role===admin`). 404 if missing, 403 if forbidden.

### PATCH /api/v1/orders/:id/status
Auth + `requireRole('admin')`. Body `{ "status":"preparing" }`
- Allowed: `pending|preparing|out_for_delivery|delivered|cancelled`
- 400 if invalid status, 404 if order not found.

---

## Cart & Payments

### GET /api/v1/cart
Cart is client-side persisted (Zustand + AsyncStorage). Server returns:
```json
{ "success": true, "message": "Cart is client-persisted; no server sync required", "data": null }
```
**200** — public (auth optional), not 501.

### /api/v1/payments
All methods on `/payments` return **501** `NOT_IMPLEMENTED` placeholder (`src/routes/index.ts:22`).

---

## Legacy / Removed placeholders
`GET /api/v1/auth/google` (GET info) removed — only `POST /api/v1/auth/google` exists (empty body returns architecture info, with `{idToken}` verifies Google token). Update Postman collection accordingly (2026-09-03).

---

## cURL Examples

```bash
# health
curl http://localhost:5000/health

# send otp
curl -X POST http://localhost:5000/api/v1/auth/send-otp -H "Content-Type: application/json" -d '{"email":"test@example.com"}'

# verify otp (otp from server log)
curl -X POST http://localhost:5000/api/v1/auth/verify-otp -H "Content-Type: application/json" -d '{"email":"test@example.com","otp":"123456"}'

# send magic link
curl -X POST http://localhost:5000/api/v1/auth/send-magic-link -H "Content-Type: application/json" -d '{"email":"test@example.com"}'

# get me (replace ID_TOKEN)
curl http://localhost:5000/api/v1/users/me -H "Authorization: Bearer $ID_TOKEN"

# catalog (public)
curl http://localhost:5000/api/v1/products
curl "http://localhost:5000/api/v1/products?isPopular=true"
curl "http://localhost:5000/api/v1/products?search=Brownie"
curl http://localhost:5000/api/v1/categories
curl http://localhost:5000/api/v1/restaurants
curl http://localhost:5000/api/v1/offers
curl http://localhost:5000/api/v1/home

# seed (idempotent, public)
curl -X POST http://localhost:5000/api/v1/seed

# addresses/orders (auth)
curl http://localhost:5000/api/v1/addresses -H "Authorization: Bearer $ID_TOKEN"
curl http://localhost:5000/api/v1/orders -H "Authorization: Bearer $ID_TOKEN"
```

---

## Error Codes Reference

| Code | HTTP | Meaning |
|---|---|---|
| VALIDATION_ERROR | 422 | Zod validation failed (details array) |
| OTP_NOT_FOUND | 400 | No OTP for that email |
| INVALID_OTP | 400 | Wrong OTP (details.remaining) |
| OTP_EXPIRED | 400 | Past expiresAt |
| OTP_ALREADY_USED | 400 | Reuse attempt |
| OTP_MAX_ATTEMPTS_EXCEEDED | 429 | Too many wrong tries |
| OTP_RESEND_COOLDOWN | 429 | Wait retryAfter secs |
| OTP_RATE_LIMITED | 429 | Hourly cap / rate limiter |
| INVALID_MAGIC_LINK | 400 | Hash not found |
| MAGIC_LINK_ALREADY_USED | 400 | Reuse |
| MAGIC_LINK_EXPIRED | 400 | Expired |
| UNAUTHORIZED | 401 | Missing/invalid auth header or token |
| INVALID_TOKEN | 401 | Bad Firebase token/hash mismatch |
| TOKEN_EXPIRED | 401 | Firebase token expired |
| FORBIDDEN | 403 | requireRole failure |
| USER_NOT_FOUND | 404 | Firestore doc missing |
| NOT_FOUND | 404 | Route not found |
| NOT_IMPLEMENTED | 501 | Future module placeholder |

---

*Generated for Foody v1.0 – single-restaurant architecture.*
