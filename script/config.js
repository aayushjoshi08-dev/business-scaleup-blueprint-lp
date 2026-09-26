// Edit these three values to go live. Nothing else in the page needs to change.

// VSL: a YouTube/Vimeo embed URL (e.g. "https://www.youtube.com/embed/VIDEO_ID")
// or a direct video file path/URL (e.g. "assets/vsl.mp4"). Leave empty until the video is ready.
export const VSL_URL = "assets/vsl.mp4";

// Payment link the "Reserve My Seat" form sends people to (Razorpay/Instamojo/GHL checkout link).
// The visitor's name, email and whatsapp are appended as query parameters.
// Leave empty until the payment link is ready.
export const CHECKOUT_URL = "";

// Payment link for the Partner Pass (2 seats, ₹1,999). Same query parameters as above, plus pass=partner.
// Leave empty until that payment link is ready — the Partner Pass form then shows "not open yet".
export const CHECKOUT_URL_PARTNER = "";

// Where people land after paying.
export const THANK_YOU_PATH = "thank-you.html";

// Thank-you page --------------------------------------------------------
// Official WhatsApp community invite link (https://chat.whatsapp.com/...). Leave empty until ready.
export const WHATSAPP_COMMUNITY_URL = "";

// Where the "Tell us about your business" form is sent (a GHL / Zapier / n8n webhook URL).
// It receives a JSON POST: fullName, phoneNumber, natureOfBusiness, annualRevenue, teamSize,
// challenge1, goal1, plus any utm_* parameters. Leave empty and the details are NOT stored anywhere.
export const DETAILS_WEBHOOK_URL = "";
