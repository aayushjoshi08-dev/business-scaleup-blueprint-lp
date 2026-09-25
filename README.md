# Business ScaleUp Blueprint — Paid LP (VSL layout)

Static landing page (no build step). Structure and flow mirror the reference VSL funnel; content is Business ScaleUp Blueprint.

## Go-live checklist — edit `script/config.js`
- `VSL_URL` — YouTube/Vimeo embed URL or a video file path (e.g. `assets/vsl.mp4`). Replace `assets/video-thumb.webp` with the VSL thumbnail (1200×675).
- `CHECKOUT_URL` — payment link the "Reserve My Seat" form sends people to.
- WhatsApp community link — set in `thank-you.html` (`#whatsapp-cta`).

Theme colours live in the `:root` tokens at the top of `css/theme.css`.

Small emoji graphics (megaphone, warning, pointing hands) are Twemoji, CC-BY 4.0.
