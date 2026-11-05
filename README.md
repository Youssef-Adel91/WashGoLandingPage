# WashGo — Landing page for wash-shop owners (Arabic, RTL)

Static site (no build step): `index.html` + `styles.css` + `app.js` + `config.js` + `assets/`.
Leads go to a Supabase table `shop_leads` (insert-only for the public).

## 1) Database (5 minutes)
1. Create a **new, separate** Supabase project (free) — don't reuse the app's production project.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Project Settings → API → copy **Project URL** and **anon public key** into `config.js`.
4. Put the WhatsApp number in `config.js` (`201012345678`, no `+`).
You read leads from Table Editor (dashboard). The anon key can only INSERT, never read.

## 2) Run locally
`npx serve .`  (or just open index.html)

## 3) Deploy
Drag the folder to Netlify Drop / Vercel / Cloudflare Pages. Then connect your domain.

## 4) QR codes per area
Link: `https://YOUR-DOMAIN/?a=maadi&utm_source=flyer&utm_campaign=nov26` → one QR per area; `area/utm_*` are saved with every lead so you know which flyers work.

## Notes
- Duplicate phone numbers are rejected by the DB; the page still shows success.
- A hidden honeypot field filters basic bots. For heavier spam add Cloudflare Turnstile later.
- Consent checkbox is required and stored (`consent=true`).
