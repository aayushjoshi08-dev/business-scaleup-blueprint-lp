// Namespace import + defaults: a stale cached config.js can never break the page (a missing named export would).
// Go-live values (payment links, webhook) live in script/config.js (site root) — shared with the other BSB pages.
import * as config from "../../script/config.js?v=5";

const { CHECKOUT_URL = "", LEAD_WEBHOOK_URL = "" } = config;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- countdown (every [data-countdown] block) ---------- */
const countdowns = $$("[data-countdown]");
function tick() {
  countdowns.forEach((box) => {
    const left = Math.max(0, new Date(box.dataset.countdown).getTime() - Date.now());
    const parts = {
      d: Math.floor(left / 864e5),
      h: Math.floor((left % 864e5) / 36e5),
      m: Math.floor((left % 36e5) / 6e4),
      s: Math.floor((left % 6e4) / 1e3),
    };
    for (const [key, value] of Object.entries(parts)) {
      const el = $(`[data-cd="${key}"]`, box);
      if (el) el.textContent = String(value).padStart(2, "0");
    }
  });
}
if (countdowns.length) {
  tick();
  setInterval(tick, 1000);
}

/* ---------- carousels ---------- */
$$("[data-carousel]").forEach((carousel) => {
  const track = $(".car-track", carousel);
  const prev = $(".prev", carousel);
  const next = $(".next", carousel);
  if (!track) return;
  const step = () => {
    const first = track.firstElementChild;
    if (!first) return 300;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  };
  const sync = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };
  prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }));
  next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }));
  track.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
});

/* ---------- modals ---------- */
let lastFocus = null;
function openModal(modal) {
  lastFocus = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("no-scroll");
}
function closeModal(modal) {
  modal.hidden = true;
  document.body.classList.remove("no-scroll");
  if (modal.id === "yt-modal") $("iframe", modal).src = "";
  lastFocus?.focus?.();
}
$$(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close]")) closeModal(modal);
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  $$(".modal").filter((m) => !m.hidden).forEach(closeModal);
});

/* ---------- click-to-play VSL (poster + video load only when needed) ---------- */
const facade = $(".vsl-facade");
if (facade) {
  facade.addEventListener("click", () => {
    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("poster", $("img", facade).src);
    video.src = facade.dataset.vsl;
    facade.replaceWith(video);
    video.play().catch(() => {});
  });
}

/* ---------- YouTube stories ---------- */
const ytModal = $("#yt-modal");
$$("[data-yt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $("iframe", ytModal).src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    openModal(ytModal);
  });
});

/* ---------- booking form (opens only on a button tap; every other CTA scrolls to the price box) ---------- */
const leadModal = $("#lead-modal");
const form = $("#lead-form");
const err = $("#lead-err");
const submit = $("#lead-submit");
const SUBMIT_LABEL = submit.textContent;

$$("[data-book]").forEach((btn) => {
  btn.addEventListener("click", () => {
    err.hidden = true;
    submit.disabled = false;
    submit.textContent = SUBMIT_LABEL;
    openModal(leadModal);
    form.elements.name.focus();
  });
});

const UTM_KEY = "bsb2026_utm";
const DEFAULT_UTM = Object.fromEntries(new URLSearchParams(document.body.dataset.utmDefault || ""));   // e.g. the ET page tags its own traffic
function utmFromUrl() {
  const utm = {};
  for (const [k, v] of new URLSearchParams(location.search)) if (k.toLowerCase().startsWith("utm_")) utm[k] = v;
  return utm;
}
function utm() {
  const fromUrl = utmFromUrl();
  try {
    if (Object.keys(fromUrl).length) { localStorage.setItem(UTM_KEY, JSON.stringify({ at: Date.now(), utm: fromUrl })); return fromUrl; }
    const saved = JSON.parse(localStorage.getItem(UTM_KEY) || "null");
    if (saved && Date.now() - saved.at < 30 * 864e5) return saved.utm || {};
  } catch (e) { /* storage unavailable */ }
  return DEFAULT_UTM;
}
utm();

const showErr = (msg) => { err.textContent = msg; err.hidden = false; };

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  err.hidden = true;
  const data = Object.fromEntries(new FormData(form).entries());
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();   // optional
  const whatsapp = String(data.whatsapp || "").replace(/[^\d+]/g, "");

  if (!name || !whatsapp) { showErr("Please enter your name and WhatsApp number."); return; }
  if (whatsapp.replace(/\D/g, "").length < 10) { showErr("Please enter a valid WhatsApp number."); return; }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) { showErr("That email doesn’t look right — fix it, or leave it blank."); return; }
  if (!CHECKOUT_URL) { showErr("Registration isn't open just yet — please check back shortly."); return; }

  submit.disabled = true;
  submit.textContent = "Please wait...";

  // Optional: keep every lead (even if payment is abandoned) — GHL / Zapier / n8n / Sheets webhook.
  if (LEAD_WEBHOOK_URL) {
    const payload = { name, email, whatsapp, page: location.href, submittedAt: new Date().toISOString(), ...utm() };
    try {
      await Promise.race([
        fetch(LEAD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch (e) { /* never block the visitor from paying */ }
  }

  const target = new URL(CHECKOUT_URL, location.href);
  Object.entries({ name, email, whatsapp }).forEach(([k, v]) => v && target.searchParams.set(k, v));
  Object.entries(utm()).forEach(([k, v]) => target.searchParams.set(k, v));
  location.href = target.href;
});

/* ---------- mobile sticky CTA: shows once the hero CTA has scrolled away, hides over the passes / footer / popups ---------- */
const bar = $("#m-bar");
if (bar && "IntersectionObserver" in window) {
  const watch = { hero: true, passes: false, foot: false, disc: false };
  const apply = () => {
    const on = !watch.hero && !watch.passes && !watch.foot && !watch.disc;
    bar.classList.toggle("show", on);
    bar.setAttribute("aria-hidden", String(!on));
    $("a,button", bar).tabIndex = on ? 0 : -1;
  };
  const observe = (el, key) => el && new IntersectionObserver(([entry]) => { watch[key] = entry.isIntersecting; apply(); }).observe(el);
  observe($(".hero-cta-m .btn") || $(".et-cta") || $(".hero .btn"), "hero");
  observe($("#passes"), "passes");
  observe($("footer"), "foot");
  observe($(".disclaimer"), "disc");
}
