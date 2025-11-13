## What You Need in Supabase
- Auth URL settings: set `SITE_URL` to your frontend origin (dev: `http://127.0.0.1:3000`) and add `http://127.0.0.1:3000/reset-password` to Redirect URLs.
- Email: use Supabase's built-in email or configure SMTP in Auth > Email (password recovery emails must be enabled).

## Frontend Changes
- Sign In page (`frontend/src/pages/SignIn.tsx`):
  - Wire the “Forgot password?” button to call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" })`.
  - Show a success notice instructing the user to check their email.
- Add a Reset Password page (`frontend/src/pages/ResetPassword.tsx`):
  - Render a form to set a new password.
  - On submit call `supabase.auth.updateUser({ password: newPassword })` and redirect to `/signin` on success.
  - Optionally, listen for `supabase.auth.onAuthStateChange` and handle the `"PASSWORD_RECOVERY"` event to ensure a recovery session is present.
- Routing (`frontend/src/App.tsx`):
  - Add `<Route path="/reset-password" element={<ResetPassword />} />`.

## Backend Changes
- None required. The reset flow is safely handled by Supabase via the anon client.

## Env & Configuration
- Frontend `.env` already set with your anon key and URL; no change needed.
- Ensure Supabase Auth URL configuration matches your dev and production domains.

## Test Plan
- Manual:
  1) On `/signin`, enter an email and click “Forgot password?”.
  2) Open the Supabase email link; it redirects to `/reset-password`.
  3) Enter a new password; on success you’re sent to `/signin`.
  4) Sign in with the new password; you land on `/wardrobe`.
- Optional:
  - Add a Jest DOM test to ensure the handler calls `resetPasswordForEmail`.

## Notes
- The reset link carries a recovery token; supabase-js creates a recovery session on your redirect page, allowing `updateUser({ password })` to succeed.
- Keep the service-role key server-only. The forgot password flow uses the frontend anon key correctly.