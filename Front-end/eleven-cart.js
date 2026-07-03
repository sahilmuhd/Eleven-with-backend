/* ===== ELEVEN — shared cart, wishlist & toast module ===== */
/* Used by every page. Backed by localStorage so state persists across the site. */

const ELEVEN = {
  CART_KEY: 'eleven_cart',
  WISH_KEY: 'eleven_wish',
  DISCOUNT_KEY: 'eleven_discount',
  COUPON_KEY: 'eleven_coupon',

  // ---- Cart ----
  getCart() {
    try { return JSON.parse(localStorage.getItem(this.CART_KEY)) || []; }
    catch { return []; }
  },
  saveCart(cart) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    this.updateAllBadges();
    this._queuePush();
  },
  addToCart(item) {
    const cart = this.getCart();
    const idx = cart.findIndex(i => i.sku === item.sku && i.size === item.size);
    if (idx >= 0) cart[idx].qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    this.saveCart(cart);
  },
  removeFromCart(sku, size) {
    this.saveCart(this.getCart().filter(i => !(i.sku === sku && i.size === size)));
  },
  changeQty(sku, size, delta) {
    const cart = this.getCart();
    const idx = cart.findIndex(i => i.sku === sku && i.size === size);
    if (idx >= 0) {
      cart[idx].qty = Math.max(1, cart[idx].qty + delta);
      this.saveCart(cart);
    }
  },
  clearCart() {
    this.saveCart([]);
    this.clearDiscount();
  },
  cartCount() { return this.getCart().reduce((s, i) => s + i.qty, 0); },
  cartSubtotal() { return this.getCart().reduce((s, i) => s + i.price * i.qty, 0); },

  // ---- Discount / coupon (shared between cart.html and checkout.html) ----
  getDiscountPct() { return Number(localStorage.getItem(this.DISCOUNT_KEY)) || 0; },
  getCouponCode() { return localStorage.getItem(this.COUPON_KEY) || ''; },
  setDiscount(pct, code) {
    localStorage.setItem(this.DISCOUNT_KEY, pct);
    localStorage.setItem(this.COUPON_KEY, pct > 0 ? code : '');
  },
  clearDiscount() {
    localStorage.removeItem(this.DISCOUNT_KEY);
    localStorage.removeItem(this.COUPON_KEY);
  },
  cartTotal() {
    const subtotal = this.cartSubtotal();
    const discount = subtotal * (this.getDiscountPct() / 100);
    return subtotal - discount;
  },

  // ---- Wishlist ----
  getWishlist() {
    try { return JSON.parse(localStorage.getItem(this.WISH_KEY)) || []; }
    catch { return []; }
  },
  saveWishlist(w) {
    localStorage.setItem(this.WISH_KEY, JSON.stringify(w));
    this._queuePush();
  },
  toggleWish(sku) {
    const w = this.getWishlist();
    const idx = w.indexOf(sku);
    if (idx >= 0) w.splice(idx, 1); else w.push(sku);
    this.saveWishlist(w);
    return w.includes(sku);
  },
  isWished(sku) { return this.getWishlist().includes(sku); },

  // ---- Server sync (logged-in customers) ----
  // localStorage stays the fast/offline working copy for everyone. For a
  // logged-in customer it's also backed up to the Django backend, so the
  // cart/wishlist survive a new device, a cleared browser, or a reinstall.
  // Guests are unaffected — nothing here runs unless ELEVEN_AUTH says
  // someone is logged in, and everything fails silently (network hiccups
  // never break the local cart).
  _pushTimer: null,
  _queuePush() {
    if (typeof ELEVEN_AUTH === 'undefined' || !ELEVEN_AUTH.isLoggedIn()) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this.pushToServer(), 600);
  },
  /* Cancels any pending debounced push and sends the current cart/wishlist
     immediately, with `keepalive` so the request survives the page
     unloading right after (e.g. clicking straight to Checkout, or closing
     the tab). Without this, a change made in the last 600ms before
     navigating away could get lost on the next sync. */
  flushPush() {
    if (typeof ELEVEN_AUTH === 'undefined' || !ELEVEN_AUTH.isLoggedIn()) return;
    clearTimeout(this._pushTimer);
    this.pushToServer({ keepalive: true });
  },
  async pushToServer(opts) {
    if (typeof ELEVEN_AUTH === 'undefined' || !ELEVEN_AUTH.isLoggedIn()) return;
    const keepalive = !!(opts && opts.keepalive);
    const token = ELEVEN_AUTH.getToken();
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token };
    try {
      await fetch(ELEVEN_API_BASE + '/cart/', {
        method: 'PUT', headers, keepalive, body: JSON.stringify({ items: this.getCart() }),
      });
    } catch (err) { /* offline/unreachable — local copy is still safe */ }
    try {
      await fetch(ELEVEN_API_BASE + '/wishlist/', {
        method: 'PUT', headers, keepalive, body: JSON.stringify({ skus: this.getWishlist() }),
      });
    } catch (err) { /* ignore */ }
  },
  /* Called on every page load once a valid token is confirmed (see
     eleven-auth.js refresh()). Server is treated as the source of truth at
     this point — it already reflects whatever the merge-on-login produced
     plus any changes made on other devices. */
  async pullFromServer() {
    if (typeof ELEVEN_AUTH === 'undefined' || !ELEVEN_AUTH.isLoggedIn()) return;
    const token = ELEVEN_AUTH.getToken();
    const headers = { 'Authorization': 'Token ' + token };
    try {
      const res = await fetch(ELEVEN_API_BASE + '/cart/', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          localStorage.setItem(this.CART_KEY, JSON.stringify(data.items));
          this.updateAllBadges();
        }
      }
    } catch (err) { /* ignore, keep local copy */ }
    try {
      const res = await fetch(ELEVEN_API_BASE + '/wishlist/', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.skus)) localStorage.setItem(this.WISH_KEY, JSON.stringify(data.skus));
      }
    } catch (err) { /* ignore */ }
    // Cart/wishlist pages may have already rendered from the (possibly
    // stale) local copy before this network round-trip finished — let them
    // know it's safe to re-render with the now-current data.
    document.dispatchEvent(new CustomEvent('eleven:synced'));
  },
  /* Called exactly once, right after a successful login/register (see
     eleven-auth.js). Combines whatever the customer built as a guest on
     this device with whatever's already saved on their account, so
     nothing gets silently overwritten either way. */
  async mergeGuestCartIntoServer() {
    if (typeof ELEVEN_AUTH === 'undefined' || !ELEVEN_AUTH.isLoggedIn()) return;
    const token = ELEVEN_AUTH.getToken();
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token };
    let serverCart = [], serverWish = [];
    try {
      const res = await fetch(ELEVEN_API_BASE + '/cart/', { headers: { 'Authorization': 'Token ' + token } });
      if (res.ok) serverCart = (await res.json()).items || [];
    } catch (err) { /* treat as empty */ }
    try {
      const res = await fetch(ELEVEN_API_BASE + '/wishlist/', { headers: { 'Authorization': 'Token ' + token } });
      if (res.ok) serverWish = (await res.json()).skus || [];
    } catch (err) { /* treat as empty */ }

    // Merge carts: same sku+size adds quantities together, everything else is unioned.
    const mergedCart = [...serverCart];
    this.getCart().forEach(localItem => {
      const idx = mergedCart.findIndex(i => i.sku === localItem.sku && i.size === localItem.size);
      if (idx >= 0) mergedCart[idx].qty += localItem.qty;
      else mergedCart.push(localItem);
    });

    // Merge wishlists: plain union of SKUs.
    const mergedWish = Array.from(new Set([...serverWish, ...this.getWishlist()]));

    localStorage.setItem(this.CART_KEY, JSON.stringify(mergedCart));
    localStorage.setItem(this.WISH_KEY, JSON.stringify(mergedWish));
    this.updateAllBadges();

    try {
      await fetch(ELEVEN_API_BASE + '/cart/', { method: 'PUT', headers, body: JSON.stringify({ items: mergedCart }) });
      await fetch(ELEVEN_API_BASE + '/wishlist/', { method: 'PUT', headers, body: JSON.stringify({ skus: mergedWish }) });
    } catch (err) { /* local merge already saved; next pushToServer will retry */ }
    document.dispatchEvent(new CustomEvent('eleven:synced'));
  },

  // ---- UI helpers ----
  updateAllBadges() {
    const count = this.cartCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },
  fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); },
  showToast(msg) {
    let t = document.getElementById('eleven-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'eleven-toast';
      t.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);
        background:var(--chalk);color:var(--ink);padding:12px 22px;font-size:13px;font-weight:600;
        letter-spacing:0.03em;z-index:9999;opacity:0;transition:all .3s ease;white-space:nowrap;
        font-family:'Inter',sans-serif;`;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2200);
  }
};

document.addEventListener('DOMContentLoaded', () => ELEVEN.updateAllBadges());

/* Flush any debounced cart/wishlist push the instant the page is about to
   go away — covers tab close, refresh, and navigating straight to another
   page right after a change (e.g. Add to cart -> Checkout). 'pagehide' and
   visibility change together cover both desktop and mobile browsers. */
window.addEventListener('pagehide', () => ELEVEN.flushPush());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') ELEVEN.flushPush();
});

/* ===== Shared mobile menu toggle ===== */
function toggleMenu(){
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.classList.toggle('open');
  menu.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}

/* Close mobile menu when any link inside it is clicked */
document.addEventListener('DOMContentLoaded', function(){
  const menu = document.getElementById('mobileMenu');
  if(!menu) return;
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      const btn = document.getElementById('hamburger');
      if(btn) btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
});
