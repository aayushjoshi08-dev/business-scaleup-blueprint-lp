# Business ScaleUp Blueprint — Paid LP (VSL layout)

Static landing page (no build step). Structure and flow mirror the reference VSL funnel; content is Business ScaleUp Blueprint.

## Go-live checklist — edit `script/config.js`
- `VSL_URL` — YouTube/Vimeo embed URL or a video file path (e.g. `assets/vsl.mp4`). Replace `assets/video-thumb.webp` with the VSL thumbnail (1200×675).
- `CHECKOUT_URL` — payment link the "Reserve My Seat" form sends people to.
- `CHECKOUT_URL_PARTNER` — payment link for the Partner Pass (2 seats, ₹1,999). Each pass form appends `pass=solo|partner` to its link.
- `WHATSAPP_COMMUNITY_URL` — community invite link; the thank-you form's button redirects here after saving.
- `DETAILS_WEBHOOK_URL` — where the thank-you details form posts (JSON). Without it the answers are not stored.

Theme colours live in the `:root` tokens at the top of `css/theme.css`.

Small emoji graphics (megaphone, warning, pointing hands) are Twemoji, CC-BY 4.0.

**After editing `script/config.js`:** bump the `?v=` on the `config.js` import at the top of `script/script.js` and `script/thankyou.js` (and the `script.js?v=` / `thankyou.js?v=` tags in the HTML). GitHub Pages lets browsers cache files for ~10 minutes; the imports tolerate a stale config, but the bump makes returning visitors see new links immediately.

## /bsb-2026/ — event landing page (format of the lp3.businesscoachingindia.com/dyp-2026 reference)
Light navy layout, built from BSB's own verified content and assets (nothing is reused from the reference page).
- CTAs scroll to the pass cards; each pass's **Book Now** opens the form pre-selected, then redirects to that pass's payment link.
- Payment links, the optional pre-payment lead webhook (`LEAD_WEBHOOK_URL`) and the WhatsApp/details settings are all in `script/config.js` (shared). After editing it, bump the `?v=` on the config import in `bsb-2026/js/main.js`.
- Case studies show outcomes only (no growth numbers). Videos open as a YouTube popup.
- **Premium theme:** `bsb-2026/premium.html` — same page in an ivory / deep-indigo / champagne-gold palette (Playfair Display + Manrope). The classic navy version is `bsb-2026/index.html`.
- **Editing / building:** edit the sources in `bsb-2026/src/` (`index.html`, `style.css`, `premium.css`, `main.js`) and run `python3 bsb-2026/build.py`. It writes `index.html`, `premium.html` and `js/main.js` (minified, CSS inlined, fonts + hero image preloaded, image sizes added). Do not edit those three by hand. Needs Python + Pillow and Node (`npx esbuild`).
- **Speed setup:** fonts are self-hosted subsets in `bsb-2026/fonts/` (no Google Fonts request); every image is a resized WebP in `bsb-2026/assets/`; the video loads only on click, from the lighter `assets/vsl-720.mp4`. Lighthouse (mobile): 100 / 100 / 100 / 100.
- **Video:** `assets/vsl.mp4` and `assets/vsl-720.mp4` are transcodes of the corrected render `VideoStudio/out/bsb-event-promo/bsb-event-promo-1x1-final.mp4` (banners/end card show the current event date). If the event date changes again, re-render that video first, then re-transcode both files.
- **Thank-you page (premium theme):** `bsb-2026/thank-you-premium.html` — send paid visitors here. Same theme as `premium.html`; one button saves the details form and then redirects to the WhatsApp community, plus a Save-The-Date block with Google Calendar / .ics buttons (10 AM–1 PM IST, 1 Nov 2026). It reads `WHATSAPP_COMMUNITY_URL` and `DETAILS_WEBHOOK_URL` from the shared `script/config.js`, prefills `?name=&whatsapp=`, forwards `pass` and `utm_*` to the webhook, and is `noindex`. Sources: `src/thank-you.html`, `src/ty-premium.css`, `src/thankyou.js` (built by `build.py`). When the payment links are added, set each checkout's success/redirect URL to this page (append `?name=...&whatsapp=...&pass=...` if the payment tool can).
- **ET Panache article page (`bsb-2026/et.html`) — point the printed QR code here.** Same page as `premium.html` but with the article's own first screen (small BSB logo, headline "Building self-reliant teams" with the box line "Find out what to fix first over one morning session" beneath it, subhead, Dr Ameet Parekh, facts box, "Book my seat — ₹1,499", Clear List Guarantee line, sticky bar), the tick list reordered, and the reader's line "I have to follow up on every single task myself." under "Why BSB?". It tags its own traffic (`utm_source=et-panache`, `utm_medium=print-qr`, `utm_campaign=bsb-1nov-2026`) unless the link already carries utm tags; edit `data-utm-default` in `build.py`'s `et_transform`. Marked `noindex`. First-screen copy lives in `src/et-hero.html`, the section after it in `src/et-walk.html`. It has no "As featured in ET Panache" lines (the other pages keep the one in the coach section), and uses the event photo `DSC_0842.JPG` (same shoot as the printed article) in `assets/coach-et-circle.webp` and `assets/coach-et.webp`.
- **Offer on all /bsb-2026/ pages (from the "changes to match ET Article B" document):** one seat, ₹1,499, 100 seats; Clear List Guarantee; transfer up to 48 hours before; bring last three months' sales and collection figures; no Partner Pass; booking form = name + WhatsApp (email optional), opened only by a button tap; "15+ years" and "2,00,000+ business owners trained"; numbers shown at final values (no count-up); spelling "Business Scale-Up Blueprint"; never "half-day" or "4 hours".
- **Footer business details:** fill `bsb-2026/src/business.json` (legal name, address, WhatsApp/phone — the same number as the printed article box —, GST, Terms and Privacy URLs) and run `python3 bsb-2026/build.py`; blank values are not shown.
