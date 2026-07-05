/* ===== ELEVEN — API client =====
   Talks to the Django backend so the live shop pages always reflect
   whatever is in the database (i.e. whatever you add/edit in the real
   Django admin at /admin/), instead of the hardcoded eleven-real-products.js.

   If the API can't be reached (backend not running, offline, CORS not
   configured yet, etc.) everything falls back to the last successful
   response cached in localStorage, and finally to the static
   ELEVEN_REAL_PRODUCTS array from eleven-real-products.js — so the site
   never goes completely blank.

   Change ELEVEN_API_BASE once you deploy the backend somewhere real. */

const ELEVEN_API_BASE = window.ELEVEN_API_BASE || 'http://127.0.0.1:8000/api';

const ELEVEN_CATALOG_CACHE_KEY = 'eleven_catalog_cache';

let _elevenCatalogPromise = null;

/* Fetches the full product catalog from the API (cached for the lifetime
   of the page — every render function on a page shares one request).
   Pass `true` to force a fresh network request (e.g. after an admin edit). */
async function fetchElevenCatalogAsync(force){
  if(_elevenCatalogPromise && !force) return _elevenCatalogPromise;

  _elevenCatalogPromise = (async () => {
    try {
      const res = await fetch(ELEVEN_API_BASE + '/products/');
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      try { localStorage.setItem(ELEVEN_CATALOG_CACHE_KEY, JSON.stringify(data)); } catch(e){ /* storage full/blocked, ignore */ }
      return data;
    } catch(err) {
      console.warn('ELEVEN: could not reach the API (' + ELEVEN_API_BASE + '/products/), falling back to the offline catalog.', err);
      try {
        const cached = localStorage.getItem(ELEVEN_CATALOG_CACHE_KEY);
        if(cached){
          const parsed = JSON.parse(cached);
          if(Array.isArray(parsed) && parsed.length) return parsed;
        }
      } catch(e){ /* ignore, fall through */ }
      return (typeof ELEVEN_REAL_PRODUCTS !== 'undefined') ? ELEVEN_REAL_PRODUCTS : [];
    }
  })();

  return _elevenCatalogPromise;
}

/* Fetches a single product by SKU — tries the dedicated endpoint first
   (fast, and reflects edits immediately), falls back to searching the
   full catalog if that fails for any reason. */
async function fetchElevenProductAsync(sku){
  try {
    const res = await fetch(ELEVEN_API_BASE + '/products/' + encodeURIComponent(sku) + '/');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(err) {
    const catalog = await fetchElevenCatalogAsync();
    return catalog.find(p => p.sku === sku) || null;
  }
}

/* Places a real order against the backend. Throws on failure so callers
   can decide how to handle it (e.g. still let the WhatsApp flow proceed). */
async function submitElevenOrder(payload){
  const headers = { 'Content-Type': 'application/json' };
  // If the customer is logged in (eleven-auth.js), attach their token so
  // the order gets linked to their account and shows up in order history.
  // Guest checkout (no token) still works exactly as before.
  if (typeof ELEVEN_AUTH !== 'undefined' && ELEVEN_AUTH.isLoggedIn()) {
    headers['Authorization'] = 'Token ' + ELEVEN_AUTH.getToken();
  }
  const res = await fetch(ELEVEN_API_BASE + '/orders/', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if(!res.ok){
    let body = null;
    try { body = await res.json(); } catch(e){ /* ignore, body stays null */ }
    const err = new Error((body && JSON.stringify(body)) || ('Order could not be placed (HTTP ' + res.status + ')'));
    err.status = res.status;
    err.body = body; // e.g. { items: 'Sorry, only 2 left in size 8 for "Stride Runner". ...' } for a stock validation failure
    throw err;
  }
  return await res.json();
}

// Called right after Razorpay's checkout widget reports a successful
// payment, so the backend can verify the signature before marking the
// order paid. See shop/views.py verify_payment_view for why this step
// can't be skipped — a browser alone can't be trusted to say "I paid".
async function verifyElevenPayment(payload){
  const res = await fetch(ELEVEN_API_BASE + '/orders/verify-payment/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if(!res.ok){
    let detail = 'Payment could not be verified (HTTP ' + res.status + ')';
    try { detail = JSON.stringify(await res.json()); } catch(e){ /* ignore */ }
    throw new Error(detail);
  }
  return await res.json();
}

/* Looks up a real order's status for the "track my order" flow. */
async function trackElevenOrder(orderId, phone){
  const res = await fetch(ELEVEN_API_BASE + '/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, phone: phone })
  });
  if(!res.ok) return null;
  return await res.json();
}
