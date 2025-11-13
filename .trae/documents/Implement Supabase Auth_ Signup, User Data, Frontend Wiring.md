## Overview
- Implement user creation against Supabase Auth, persist basic user data, and wire Sign In/Up pages to working flows without disrupting existing routes.
- Reuse existing Express routing and Supabase clients; keep changes minimal and consistent with repository patterns.

## Backend API
- Keep router location and mount consistent: `backend/src/routes/auth.ts` mounted at `/api/auth` from `backend/src/server.ts:10,20`.
- Confirm and extend existing endpoint:
  - `POST /api/auth/signup` (already present in `backend/src/routes/auth.ts:7–27`): accept `{ email, password, full_name }` and call `supabaseService.auth.admin.createUser(...)` with `user_metadata`.
  - After creation, insert a row into `profiles` with `id` (user id), `email`, `full_name`, `created_at` via `supabaseService.from("profiles")` for basic user data.
- Keep existing endpoints:
  - `GET /api/auth/me` to fetch current user from JWT (`backend/src/routes/auth.ts:40–46` using helper in `backend/src/middleware/requireUser.ts:4–13`).
  - `GET /api/auth/users/:id` remains for admin lookup (`backend/src/routes/auth.ts:31–38`).
- Validation and errors:
  - Validate required fields, return 400 with message on invalid input; return 201 on success with `{ id, email }`.

## User Data
- Table: use a `profiles` table in Supabase (common default) to store lightweight user data. Fields: `id UUID PRIMARY KEY`, `email TEXT`, `full_name TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`.
- Insert happens in the signup handler immediately after `createUser` succeeds.

## Frontend Changes
- Sign Up page: `frontend/src/pages/SignUp.tsx:7–15`
  - Implement `handleSubmit` to `fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password, full_name }) })`.
  - On success, trigger Sign In flow (below) and route to app.
- Sign In page: `frontend/src/pages/SignIn.tsx:7–14`
  - Implement `handleSubmit` using `supabase.auth.signInWithPassword({ email, password })` via `frontend/src/lib/supabaseClient.ts:3–6`.
  - After success, read `session.access_token` and set `Authorization: Bearer <token>` for backend calls that require auth (e.g., `/api/auth/me`). Keep existing public fetches unchanged (`frontend/src/pages/Wardrobe.tsx:59–77`, `frontend/src/pages/Outfits.tsx:36–44`).
- Optional helper (kept minimal to avoid new files): in each page, add a tiny `authFetch(path, init)` wrapper that augments headers with the current `access_token` for any protected endpoints.

## Testing
- Add backend request tests to validate API quickly:
  - Install `jest` + `ts-jest` + `supertest` for `backend`.
  - Create `backend/tests/auth.signup.test.ts` to cover: 201 on valid input; 400 on missing fields; 409 when email already exists (surface Supabase error).
- Add a simple frontend smoke test in CRA for Sign In/Up handlers if desired, but prioritize manual validation.
- Provide manual test commands:
  - `curl -X POST http://localhost:4000/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"user@example.com","password":"secret","full_name":"Test User"}'`
  - After signing in on frontend, call `fetch('/api/auth/me')` with `Authorization` header to verify session.

## Env & Security
- Frontend env: uses `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in `frontend/src/lib/supabaseClient.ts:3–6`. Ensure `.env` contains your provided values.
- Backend env: uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in `backend/src/lib/supabase.ts:5–8`, and `ORIGIN` CORS in `backend/src/server.ts:15`.
- Security note: service-role keys must remain only in backend; the frontend should use the anon key. If the provided frontend key is service-role, replace with the anon key to avoid exposing elevated privileges.

## Rollout Steps
1) Backend: extend `POST /api/auth/signup` to add `full_name` and insert `profiles` row; keep response shape stable.
2) Frontend: implement Sign Up `fetch` call; implement Sign In with Supabase client; wire token to protected calls when needed.
3) Verify with manual `curl` and in-browser tests; then add `jest/supertest` tests for backend `signup` route.

## References
- Routers mounted: `backend/src/server.ts:7–20`
- Supabase service client: `backend/src/lib/supabase.ts:5–8`
- Auth routes: `backend/src/routes/auth.ts:7–46`
- Frontend Supabase client: `frontend/src/lib/supabaseClient.ts:3–6`
- Sign In page: `frontend/src/pages/SignIn.tsx:7–14`
- Sign Up page: `frontend/src/pages/SignUp.tsx:7–15`
- CRA proxy: `frontend/package.json:47`