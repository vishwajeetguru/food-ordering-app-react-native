# Foody Postman Collection

## Import
1. Open Postman → `File` → `Import` → select both:
   - `Foody-Backend.postman_collection.json` (collection)
   - `Foody-Backend.postman_environment.json` (environment)
2. Select environment **Foody - Local** (top-right).
3. Ensure backend is running: `npm run dev` → `http://localhost:5000/health` should return `success:true`.

## Variables
Collection variables (auto-managed + editable):

| Variable | Default | Notes |
|---|---|---|
| `baseUrl` | `http://localhost:5000` | Change to prod URL when deployed |
| `email` | `test@example.com` | Change to avoid cooldown/rate-limit collisions |
| `channel` | `email` | `sms` is future placeholder |
| `otp` | (empty) | **Paste OTP from backend console**: after `send-otp` look for `[DEV] Email OTP for test@example.com: 654321` |
| `magicToken` | (empty) | Auto-filled after `send-magic-link` (dev). Or copy `?token=` from link |
| `customToken` | (empty) | Auto-saved by `verify-otp` / `verify-magic-link` |
| `idToken` | (empty) | **Use this for Bearer**. In mock mode `=customToken`. In real Firebase, exchange `customToken` via `signInWithCustomToken(auth, customToken)` then paste `user.getIdToken()` here |
| `testToken` | (empty) | Helper `test-token-{{uid}}` – works in mock mode without Firebase |
| `uid` | (empty) | Auto-saved |
| `password` / `newPassword` | `StrongPass1` / `NewStrong2` | Must include upper+lower+digit, 8+ chars |
| `oobCode` | (empty) | Firebase password-reset action code |
| `productId` | `p1` | Seeded product id (p1-p8, 8 total). Auto-updated by GET /products list |
| `newProductId` | (empty) | Auto-saved after POST /products (admin) |
| `categoryId` | `1` | Seeded category (1=Pizza, 2=Burgers... 6 total). Auto-updated by GET /categories |
| `restaurantId` | `r1` | Single restaurant Foody House. Auto-updated by GET /restaurants |
| `offerId` | `o1` | Offer id (o1 FOODY20, o2 FREESHIP). Auto-updated by GET /offers |
| `addressId` | (empty) | Auto-saved after POST /addresses |
| `orderId` | (empty) | Auto-saved after POST /orders |
| `orderNumber` | (empty) | Auto-saved orderNumber (ORD-...) |

## Recommended Run Order
1. **Health**: `GET /health`, `GET /`
2. **OTP**: `POST send-otp` → copy OTP from server log into `otp` → `POST verify-otp` (auto saves `idToken`/`uid`/`testToken`)
3. **Users**: `GET /users/me` (Bearer `{{idToken}}`), `PATCH /users/me`, test negative 422 cases
4. **Password (AUTH)**: `POST set-password`, `POST change-password`, `POST forgot-password`
5. **Magic Link**: `POST send-magic-link` (auto saves `magicToken`) → `POST verify-magic-link` OR `GET verify-magic-link?token={{magicToken}}` → try verifying same token again to see `MAGIC_LINK_ALREADY_USED` (400)
6. **Session**: `GET /auth/me`, `POST /logout`, `POST /auth/google` (info + with idToken), negative token tests
7. **Catalog**: `GET /products` (saves `productId`, now 8 seeds p1-p8), `GET /products?categoryId=...`, `GET /products?search=pizza`, `GET /products/:id`, `POST /products` (admin — 403 if not admin), `PATCH /products/:id`, negatives; `GET /categories`, `GET /categories/:id`
8. **Extended Filters (NEW)**: `GET /products?isPopular=true` (p1,p2,p4), `GET /products?isRecommended=true` (p1,p3,p6), `GET /products?isVeg=true/false`, `GET /products?search=Brownie` (p6) & `search=Chinese` (p5) — verifies 8-product seed
9. **Restaurant, Offers & Home (NEW, public)**: `GET /restaurants` (saves `restaurantId` r1), `GET /restaurant/default`, `GET /restaurants/:id`, `GET /offers` (saves `offerId`), `GET /offers/:id`, `GET /home` (aggregated: restaurant+offers+categories+popular+recommended)
10. **Addresses (AUTH)**: `GET /addresses` → `POST /addresses` (saves `addressId`) → `PATCH /addresses/:id` → `DELETE /addresses/:id` + negatives
11. **Orders (AUTH)**: `POST /orders` (saves `orderId`/`orderNumber`) → `GET /orders` → `GET /orders/:id` → `PATCH /orders/:id/status` (admin — 403 if not admin) + negatives
12. **Seed & Maintenance (NEW)**: `POST /seed` / `GET /seed` idempotent (public), `POST /seed?force=true` admin — seeds 8 products, 6 categories, 1 restaurant, 2 offers from frontend mock if missing
13. **Cart & Payments**: `GET /cart` → 200 client-persisted (not 501); `GET/POST /payments` → 501 placeholder
14. **Negatives folder**: invalid email / short otp / weak password → 422
15. **Destructive last**: `DELETE /users/me` – then `GET /users/me` should 404 (run after you have finished Orders/Addresses tests, since they need same uid)

## Roles — admin vs customer
- Default new users have `role: customer`.
- `POST /products`, `PATCH /products/:id`, `PATCH /orders/:id/status`, and `POST /seed?force=true` require `role: admin` (`requireRole('admin')` → 403 otherwise).
- In **mock/memory mode** you can promote: `memoryUsers.get(uid).role = 'admin'` in server REPL, or patch Firestore doc `users/{uid}` `{role:"admin"}` then call those endpoints with that user's `idToken`/`testToken`.
- Otherwise those requests are expected to return `403 FORBIDDEN` — the collection's test expects `201 or 403` and logs the result.

## Mock vs Real Firebase
- **Mock (default, no `.env` Firebase creds)**: `verify-otp` returns base64 mock `customToken` that is used directly as `idToken` (collection does this automatically). No email actually sent; OTP/magic link printed to console. `GET /categories`/`GET /products` return seeded in-memory data (8 products p1-p8, 6 categories, r1, 2 offers) even without Firestore. `POST /seed` returns `skippedReason: mock mode`.
- **Real Firebase (with `FIREBASE_*` or `service-account.json`)**: client must exchange `customToken` with Firebase Web SDK: `const cred = await signInWithCustomToken(auth, customToken); const idToken = await cred.user.getIdToken();` then paste into `{{idToken}}`. Firestore is auto-seeded on startup (`src/utils/seed.ts`) and via `POST /seed` — idempotent, only inserts missing ids (p5-p8 etc.). Manual `npm run seed` / `npm run seed:force` also available.

## What changed — 2026-09-03 v2 (frontend mock → backend DB)
- **Database: frontend mock → backend source of truth**. Previously `fooody-backend` seeded only 4 products (p1-p4). Now synced to frontend `src/services/mock/products.ts`:
  - **Products 4 → 8**: added p5 Hakka Noodles (Chinese), p6 Chocolate Fudge Brownie (Desserts, 4.9★), p7 Classic Cold Coffee (Beverages), p8 Paneer Tikka Masala Pizza. All fields `isPopular`/`isRecommended`/`prepTime`/`categoryName` preserved so `home` slices `Popular Today` (=isPopular p1,p2,p4) and `Recommended` (=isRecommended p1,p3,p6) match frontend.
  - **Categories 6** already matched (Pizza/Burgers/Biryani/Chinese/Desserts/Beverages) — kept.
  - **Restaurant r1 Foody House** + **Offers o1 FOODY20 / o2 FREESHIP** added as new collections `restaurants`/`offers` (were only frontend mock before). New repositories `restaurant.repository.ts:1` / `offer.repository.ts:1`, controllers, routes `restaurant.routes.ts:1` / `offer.routes.ts:1`, constants `COLLECTIONS.RESTAURANTS/OFFERS`.
- **New APIs (public)**:
  - `GET /api/v1/restaurants`, `GET /api/v1/restaurants/:id`, `GET /api/v1/restaurant/default`, `GET /api/v1/restaurant/:id` (alias)
  - `GET /api/v1/offers`, `GET /api/v1/offers/:id`
  - `GET /api/v1/home` — aggregated `restaurant+offers+categories+popular+recommended` for home screen single call
  - Product filters extended: `?isPopular=true`, `?isRecommended=true`, `?isVeg=true/false` + `search` now also matches `categoryName` (Chinese→p5). Controller `product.controller.ts:8` + repository `product.repository.ts:63` now handles these without composite index.
- **Seed automation**: `src/utils/seed.ts:1` idempotent seeding (checks per-id, not just empty), auto-runs on `src/server.ts:6` startup if Firebase configured, plus `POST /api/v1/seed` (public idempotent) and `POST /api/v1/seed?force` (admin) — also `npm run seed` scripts in `package.json:9`.
- **Postman**: 30 → 72 requests, 8 → 14 folders. New folders `07b — Products Extended Filters`, `08 — Restaurant, Offers & Home`, `11 — Seed & Maintenance`. New vars `restaurantId`, `offerId`. Verified via `test_new.cjs` (14 checks pass).
- **Previous v1 2026-09-03** (still included): replaced `07 Placeholders 501` with real catalog/addresses/orders/cart fix, fixed `GET /auth/google` → `POST`.

## Tips
- If `429 OTP_RESEND_COOLDOWN` change `email` or wait 60s (config `OTP_RESEND_COOLDOWN_SECONDS`).
- If `401 INVALID_TOKEN` ensure `Authorization: Bearer {{idToken}}` header is present and `idToken` not expired. In mock mode try `Bearer {{testToken}}` instead.
- If `403 FORBIDDEN` on `POST /products` or `PATCH /orders/:id/status` or `POST /seed?force`, your user is `customer` — promote to `admin` per Roles section.
- Collection test scripts auto-log responses to Postman Console (`View → Show Postman Console`) and auto-save `productId`, `categoryId`, `restaurantId`, `offerId`, `addressId`, `orderId`, etc.
- Run `GET /home` first to verify all seed data in one call (should return 1 restaurant, 2 offers, 6 categories, 3 popular, 3 recommended).
