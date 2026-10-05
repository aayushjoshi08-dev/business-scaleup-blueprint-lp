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
