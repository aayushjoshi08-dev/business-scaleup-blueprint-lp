import { WHATSAPP_COMMUNITY_URL, DETAILS_WEBHOOK_URL } from "./config.js";

const form = document.getElementById("details-form");
const errorBox = document.getElementById("details-error");
const submitBtn = document.getElementById("details-submit");
const waCard = document.getElementById("whatsapp-card");
const waCta = document.getElementById("whatsapp-cta");
const waNote = document.getElementById("whatsapp-note");

// Prefill from the checkout redirect (?name=...&whatsapp=...)
const params = new URLSearchParams(window.location.search);
const prefill = {
  fullName: params.get("name"),
  phoneNumber: params.get("whatsapp") || params.get("phone"),
};
Object.entries(prefill).forEach(([field, value]) => {
  if (value && form.elements[field]) form.elements[field].value = value;
});

// WhatsApp community link
if (WHATSAPP_COMMUNITY_URL) {
  waCta.href = WHATSAPP_COMMUNITY_URL;
} else {
  waCta.addEventListener("click", (event) => {
    event.preventDefault();
    waNote.hidden = false;
  });
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());
  const missing = [...form.querySelectorAll("[required]")].some((el) => !String(el.value || "").trim());
  if (missing) {
    showError("Please fill in all fields before submitting.");
    return;
  }
  if (String(data.phoneNumber).replace(/\D/g, "").length < 10) {
    showError("Please enter a valid phone number.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  if (DETAILS_WEBHOOK_URL) {
    try {
      const payload = { ...data, submittedAt: new Date().toISOString(), page: window.location.href };
      for (const [key, value] of params.entries()) {
        if (key.toLowerCase().startsWith("utm_")) payload[key] = value;
      }
      const response = await fetch(DETAILS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Request failed with status " + response.status);
    } catch (error) {
      console.error("Details submission failed", error);
      showError("We couldn't save your details. Please check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Complete My Registration";
      return;
    }
  }

  submitBtn.textContent = "Registration Complete ✓";
  waCard.classList.add("is-active");
  waCard.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Add to calendar: session starts 9:30 AM IST (04:00 UTC) and ends 1:00 PM IST (07:30 UTC) on 18 Oct 2026
const TITLE = "Business ScaleUp Blueprint — Mumbai";
const LOCATION = "Novotel Mumbai International Airport, Andheri-Kurla Road, Marol, Mumbai";
const DETAILS = "Session starts at 9:30 AM with a 5-Star Breakfast Meet & Greet and runs until 1:00 PM.";
const START = "20261018T040000Z";
const END = "20261018T073000Z";

document.getElementById("gcal-link").href =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent(TITLE) +
  "&dates=" + START + "/" + END +
  "&details=" + encodeURIComponent(DETAILS) +
  "&location=" + encodeURIComponent(LOCATION);

document.getElementById("ics-link").addEventListener("click", (event) => {
  event.preventDefault();
  const esc = (text) => text.replace(/,/g, "\\,");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Business ScaleUp Blueprint//Mumbai//EN",
    "BEGIN:VEVENT",
    "UID:bsb-mumbai-18oct2026@businessscaleupblueprint",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:" + START,
    "DTEND:" + END,
    "SUMMARY:" + TITLE,
    "LOCATION:" + esc(LOCATION),
    "DESCRIPTION:" + esc(DETAILS),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "business-scaleup-blueprint-mumbai.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
