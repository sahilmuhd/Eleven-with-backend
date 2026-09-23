/* ===== ELEVEN — API config =====
   One place to point the whole app at your backend.

   Vite exposes env vars prefixed with VITE_ via import.meta.env.
   Set VITE_API_BASE in a .env file to override, otherwise this falls
   back to the deployed backend, matching the original static site. */

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://eleven-with-backend.onrender.com/api'

// For local dev against a Django server running on your machine, create
// a .env.local file with:
//   VITE_API_BASE=http://127.0.0.1:8000/api

// The business WhatsApp number that "Buy on WhatsApp" messages go to.
// Digits only, with country code, no + or spaces (e.g. 917560943996).
// Override with VITE_WHATSAPP_NUMBER in a .env file if this ever changes.
export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || '917560943996'

// The public site origin, used to build shareable product links in the
// WhatsApp message. Override with VITE_SITE_URL if the domain changes.
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || 'https://eleven-frontend.onrender.com'
