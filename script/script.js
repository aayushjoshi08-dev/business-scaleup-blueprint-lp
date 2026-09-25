import { VSL_URL, CHECKOUT_URL, THANK_YOU_PATH } from "./config.js";

const videoButton = document.querySelector("[data-video]");
const modal = document.querySelector(".modal");
const modalFrame = document.querySelector(".modal iframe");
const modalVideo = document.querySelector(".modal-video");
const videoNote = document.querySelector("[data-video-note]");
const closeButton = document.querySelector(".modal-close");

const leadModal = document.querySelector("[data-lead-modal]");
const leadForm = document.querySelector("[data-lead-form]");
const leadCloseButton = document.querySelector("[data-lead-close]");
const leadSubmitButton = document.querySelector("[data-lead-submit]");
const leadError = document.querySelector("[data-lead-error]");
const leadTriggers = document.querySelectorAll("[data-lead-trigger]");

const SUBMIT_LABEL = "Reserve My Seat Now ₹1,499";
const isFile = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

function closeModal() {
  modal.hidden = true;
  modalFrame.src = "";
  modalFrame.hidden = false;
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.hidden = true;
  }
  if (videoNote) videoNote.hidden = true;
}

if (videoButton && modal && modalFrame && closeButton) {
  videoButton.addEventListener("click", () => {
    modal.hidden = false;
    if (!VSL_URL) {
      modalFrame.hidden = true;
      if (videoNote) videoNote.hidden = false;
    } else if (isFile(VSL_URL) && modalVideo) {
      modalFrame.hidden = true;
      modalVideo.src = VSL_URL;
      modalVideo.hidden = false;
      modalVideo.play().catch(() => {});
    } else {
      modalFrame.src = VSL_URL + (VSL_URL.includes("?") ? "&" : "?") + "autoplay=1";
    }
    closeButton.focus();
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
}

const UTM_STORE_KEY = "bsb_utm";
const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readUtmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase().startsWith("utm_")) utm[key] = value;
  }
  return utm;
}

function persistUtm(utm) {
  if (!utm || !Object.keys(utm).length) return;
  try {
    localStorage.setItem(UTM_STORE_KEY, JSON.stringify({ utm, savedAt: Date.now() }));
  } catch (error) {
    // storage disabled - fallback is simply lost
  }
}

function getUtmParams() {
  const fromUrl = readUtmFromUrl();
  if (Object.keys(fromUrl).length) {
    persistUtm(fromUrl);
    return fromUrl;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(UTM_STORE_KEY) || "null");
    if (stored && Date.now() - stored.savedAt < UTM_TTL_MS) return stored.utm || {};
  } catch (error) {
    // ignore
  }
  return {};
}

function setLeadFormState(isSubmitting) {
  if (!leadSubmitButton) return;
  leadSubmitButton.disabled = isSubmitting;
  leadSubmitButton.textContent = isSubmitting ? "Please wait..." : SUBMIT_LABEL;
}

function showLeadError(message) {
  if (!leadError) return;
  leadError.textContent = message;
  leadError.hidden = false;
}

function clearLeadError() {
  if (!leadError) return;
  leadError.textContent = "";
  leadError.hidden = true;
}

function openLeadModal() {
  if (!leadModal) return;
  clearLeadError();
  leadModal.hidden = false;
  document.body.classList.add("modal-open");
  leadForm?.querySelector("input[name='name']")?.focus();
}

function closeLeadModal() {
  if (!leadModal) return;
  leadModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, "").trim();
}

leadTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openLeadModal();
  });
});

persistUtm(readUtmFromUrl());

if (leadModal && leadForm && leadCloseButton) {
  leadCloseButton.addEventListener("click", closeLeadModal);

  leadModal.addEventListener("click", (event) => {
    if (event.target === leadModal) closeLeadModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !leadModal.hidden) closeLeadModal();
  });

  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearLeadError();

    const formData = new FormData(leadForm);
    const name = String(formData.get("name") || "").trim();
    const whatsapp = normalizePhone(String(formData.get("whatsapp") || ""));
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const challenge = String(formData.get("challenge") || "").trim();
    const serious = formData.get("serious") === "Yes";

    if (!name || !whatsapp || !email || !challenge || !serious) {
      showLeadError("Please complete every required field before reserving your seat.");
      return;
    }

    if (whatsapp.replace(/\D/g, "").length < 10) {
      showLeadError("Please enter a valid Whatsapp number.");
      return;
    }

    if (!CHECKOUT_URL) {
      showLeadError("Registration isn't open just yet — please check back shortly.");
      return;
    }

    setLeadFormState(true);

    const target = new URL(CHECKOUT_URL, window.location.href);
    target.searchParams.set("name", name);
    target.searchParams.set("email", email);
    target.searchParams.set("whatsapp", whatsapp);
    target.searchParams.set("challenge", challenge);
    const utm = getUtmParams();
    Object.keys(utm).forEach((key) => target.searchParams.set(key, utm[key]));
    window.location.href = target.href;
  });
}

export { THANK_YOU_PATH };
