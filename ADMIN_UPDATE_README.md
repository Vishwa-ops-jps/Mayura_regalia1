# Mayura Regalia - merged project: setup, restore and rollback

## Run it
1. `cd backend && npm install && node check-admin-auth.js` (should print "Sign + verify round trip: OK")
2. `npm start` in backend, then `cd ../frontend && npm install && npm start`
3. Admin: http://localhost:3000/admin/login  (log in again once - old saved tokens are rejected)

## What this project is
- Base: Mayura_Regalia_ZIP.zip (the newer of the two uploads).
- Plus: 5 extra cover images from the "before corrections" backup, the admin token-expiry fix,
  the product-edit-modal gallery styles, and check-admin-auth.js. Details in MERGE_NOTES.md.
- node_modules, build and .git are not included. Reinstall with npm install.

## Rollback (nothing here deletes your originals)
- Keep your original uploads untouched:
  - Mayura_Regalia_backup_before_corrections_ZIP.zip  (state before corrections)
  - Mayura_Regalia_ZIP.zip                            (newer state, before these fixes)
- To undo only the fixes, restore these files from Mayura_Regalia_ZIP.zip:
  backend/routes/authRoutes.js
  frontend/src/admin/layout/AdminLayout.js
  frontend/src/admin/pages/AdminLogin.js
  frontend/src/admin/services/adminApi.js
  frontend/src/admin/styles/AdminDashboard.css
  frontend/src/services/authService.js
- To restore everything: unzip one of the original ZIPs into a fresh folder and run npm install.

## Step 7 changes (hero)
- Homepage hero now loads its slides from the database (new public GET /api/settings/hero).
- Admin > Settings > Hero Section Slides: add/remove/reorder slides, upload 1-4 photos per slide, edit text.
- Removed the hardcoded German Silver slide; default slides no longer repeat any image.
- settings.setting_value is now LONGTEXT (done automatically at backend start) so uploaded images fit.
- Files: backend settingModel/settingController/settingRoutes/db.js; frontend HeroSection.js, HeroSection.css, admin Settings.js, new admin HeroSlidesEditor.js.

## Not done yet
- The admin source ZIP (Mayura_Regalia_updated_admin_replaced.zip) was never received, so the admin
  replacement from the original instructions has NOT been applied.

## Step 8
- Sarees default slide: removed CoverImage3.jpg (same photo as BlueSaree.jpeg), so it now has 3 distinct images.
- New admin menu item 'Hero Section' (/admin/hero), right under Dashboard, opens the slide editor directly.

## Step 9 (professional-site basics)
- New pages: /contact, /privacy-policy, /terms-and-conditions, /shipping-policy, /returns-policy (frontend/src/pages/PolicyPage.js, Contact.js, styles/InfoPages.css).
- Edit business details and policy numbers in frontend/src/data/storeInfo.js (phone, email, address, hours, delivery days, return window, GSTIN). Policy wording is in frontend/src/data/policies.js. Items marked CONFIRM are my assumptions.
- Footer now links to these pages (Shipping and Returns used to point to the home page); optional GSTIN line.
- Browser tab titles for main pages, share-preview meta tags, public/robots.txt (add the Sitemap line after going live).
- Backend: helmet security headers and login rate limiting (30 tries per 15 min). Run `npm install` in backend to get the two new packages; the server still starts without them.
- Not done yet: order-tracking page for customers, order emails, sitemap.xml (needs live domain), size/care details on product pages.

## Step 10 (order tracking + order emails)
- Customer page /track-order: order number + email/phone used at checkout -> status timeline, courier details, items. Linked from the footer, My Account orders and the order-success page.
- Backend: POST /api/orders/track (rate limited). The old public GET /api/orders/number/:orderNumber exposed names/phones/addresses by order number alone; it is now admin-only (the storefront never used it).
- Database (added automatically at backend start): orders.courier_name / tracking_number / tracking_url and an order_status_history table (dated status changes).
- Admin > Orders > View: new "Shipping / tracking details" box (courier, tracking number, optional link).
- Emails (nodemailer): order confirmed, being prepared, shipped (with courier details), delivered, cancelled. Sent automatically on order placement and when the admin changes the order status. A failed or unconfigured email never blocks an order.
- To turn emails on: run `npm install` in backend, then copy the SMTP lines from backend/.env.example into backend/.env and restart. Without them emails are skipped and a note is printed at startup.
- Orders placed before this update have no status history; their timeline shows only the current step.

## Step 11 (theme, Google profile, material filter)
- Base: your uploaded Mayura_Regalia_1.zip (your working copy: it already had the order tracking/email step and npm packages installed).
- Storefront colours: baby pink backgrounds (#FDE4EE page, #F8C8DC header/footer), white cards, black text (#111), black buttons. Edit the palette in frontend/src/styles/index.css (:root). Admin panel colours are unchanged.
- Google Business Profile link (frontend/src/data/storeInfo.js -> googleBusiness) shown in the footer ("Find us on Google") and on the Contact page.
- Fix: backend/controllers/productController.js now passes the `material` filter to the model (the model and frontend already supported it, but the controller dropped it).

## Step 12 (product page info, sitemap)
- Product pages: new collapsible sections (Product details, size/fit guide by category, Care instructions, Shipping & returns) in frontend/src/components/ProductInfoSections.js. Size/fit and care text is general guidance, not measurements of a specific piece; shipping/returns numbers come from frontend/src/data/storeInfo.js.
- Backend: GET /sitemap.xml (pages, active categories, all products) and GET /robots.txt with the Sitemap line, both built from the database using FRONTEND_URL. Set FRONTEND_URL in backend/.env to the live domain before submitting the sitemap to Google Search Console.
- Note: these two routes are served by the backend, so they appear at the site root when the backend hosts the frontend build (as render.yaml does). With a separately hosted frontend, point your host's /sitemap.xml and /robots.txt at the backend.

## Step 13 (colour)
- Storefront accent colour is #742A40 (change it in one place: --brand and --brand-dark in frontend/src/styles/index.css). Buttons, borders, icons and badges use it; h1/h2 headings, prices, hover states and small labels use it as text; all other text stays black (#111). Later changed from #AF005F to #742A40 on request; #930050 is no longer used anywhere.
- Hero: the logo now uses LOGO_Mayura_Regalia.png (no circle) instead of the round emblem.
- The video background in the shop page stays black on purpose (it frames videos).

- Header logo enlarged (174x116 px on desktop, 124x83 tablet, 104x70 phone) in frontend/src/styles/Header.css.

## Step 18 (Gold menu + menu/search match, re-applied to the latest project)
- Why Gold Bangles (and Gold Rings/Bracelets/Chains/Pendants) were empty from the header: the menu links open categories literally named "Gold Bangles" etc., but products are filed as Bangles, Rings, Bracelets, Necklaces, so the exact category match found nothing.
- Fix in backend/models/productModel.js: Gold menu entries show the gold products (name, material or description mentions gold) of the matching plain category; any other menu link with no exact match falls back to the same word-based match search uses. frontend/src/pages/Shop.js no longer discards the server's list with its exact-match filter.
- Restart the backend after replacing the files.

## Step 19 (hero size + slideshow, hero editor keeps default photos)
- Storefront hero was very tall (each photo row ~650 px) and had no visible controls. Re-applied the slideshow version: fixed banner height, prev/next arrows, clickable dots, swipe on phones, auto-advance every 5.5 s even with the mouse over it (frontend/src/components/HeroSection.js, styles/HeroSection.css).
- Admin > Hero Section: the editor was removing every image whose address starts with "/" (such as /CoverImage1.png) and showing a "re-upload" warning, although those files exist in the site's public folder and display on the homepage. It now keeps them and only drops images that really fail to load (HeroSlidesEditor.js). The "Reset to defaults" button stays.
