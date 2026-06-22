# Wedding Invitation Website — Angular 20

Premium, mobile-first wedding invitation site. Standalone components, signals, JSON-driven content, no backend.

## What's included (Phase 1 — core sections)
- Hero (full-screen, animated entrance, names + date)
- Couple (bride/groom cards)
- Live Countdown (days/hours/min/sec, signal-based, ticks every second)
- Event Schedule (cards, icons via Bootstrap Icons)
- Venue (Google Maps embed + Get Directions button)
- Gallery (category filter + lightbox, lazy-loaded images)
- Footer

All content is driven by `src/assets/data/wedding.json` — no hardcoded text. Edit that file to change names, dates, venue, gallery, events, etc.

Replace the placeholder images in `src/assets/images/` with real photos (same filenames, or update the JSON paths).

## Not yet built (next phase, on request)
Our Story Timeline, Digital Invitation Card (download as image), Background Music Player, Share Invitation (WhatsApp/FB/Telegram/copy link), QR Code section, Friendship Tribute section.

## Run locally
```
npm install
npm start
```
Visit http://localhost:4200

## Build for production
```
npm run build
```
Output goes to `dist/wedding-invite/browser` — deploy that folder directly to Vercel/Netlify (static site, no backend needed).

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. Framework preset: Angular. Build command: `npm run build`. Output directory: `dist/wedding-invite/browser`.

## Customize theme
Colors/fonts are CSS variables in `src/styles.scss` (`--primary`, `--secondary`, `--accent`, `--bg`, `--text`).
