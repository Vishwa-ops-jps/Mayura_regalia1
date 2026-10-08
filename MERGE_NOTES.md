# Mayura Regalia - merged project (step 1 of 10)

Base: Mayura_Regalia_ZIP.zip (newer, files dated 30 Sep 16:36-16:50).
Kept from older backup: CoverImage1/2 -banner/-wide and CoverImage3-wide images (unused by current code; nothing lost).
Excluded to keep the zip small: node_modules, build, .git. Run npm install in frontend and backend, then npm start.

Not yet changed: admin token fix and admin ZIP integration (admin source ZIP not received).

## Step 2 (token fix)
- backend/routes/authRoutes.js: new GET /api/auth/verify (admin-only).
- frontend/src/services/authService.js: verify() and handleExpired().
- frontend/src/admin/services/adminApi.js: admin calls that return an expired/invalid token now clear the session and go to /admin/login.
- frontend/src/admin/layout/AdminLayout.js: checks the token with the server when an admin page opens.
- frontend/src/admin/pages/AdminLogin.js: shows "Your session expired" after a redirect.
Customer files untouched. Restart the backend after updating.

## Step 3 (product edit modal)
- frontend/src/admin/styles/AdminDashboard.css: added scoped, hardened styles for the product image gallery (92px thumbnails, small ◀ ★ ✕ buttons, always visible on touch screens). No JS changes.

## Step 4 (admin audit)
- Every admin page calls the API through adminApi.js, so all get the expired-token handling. (admin/pages/AdminDashboard.js is an unused legacy file, not routed; left as is.)
- Every admin-only backend route has requireAdmin; all routes pass a syntax check.
- New helper: backend/check-admin-auth.js (run `node check-admin-auth.js` in backend) prints a JWT_SECRET fingerprint so you can spot two backends using different secrets.

## Step 5 (consistency check)
- All 63 frontend source files compile with the project's own Babel config; 0 missing relative imports.
- All backend files pass a syntax check.
- Compared with Mayura_Regalia_ZIP.zip, only these files differ: authRoutes.js, AdminLayout.js, AdminLogin.js, adminApi.js, AdminDashboard.css, authService.js (admin login helper), check-admin-auth.js, this notes file, and 5 extra cover images. No customer page, component, product data or product image was changed.

## Step 6
- Added ADMIN_UPDATE_README.md (run, rollback, open items). No code changes.

## Step 7 (hero)
- See ADMIN_UPDATE_README.md 'Step 7 changes'. 'German Silver' still exists as a product category in the menu and product data (unchanged).
