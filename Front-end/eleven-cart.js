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
  saveWishlist(w) { localStorage.setItem(this.WISH_KEY, JSON.stringify(w)); },
  toggleWish(sku) {
    const w = this.getWishlist();
    const idx = w.indexOf(sku);
    if (idx >= 0) w.splice(idx, 1); else w.push(sku);
    this.saveWishlist(w);
    return w.includes(sku);
  },
  isWished(sku) { return this.getWishlist().includes(sku); },

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
