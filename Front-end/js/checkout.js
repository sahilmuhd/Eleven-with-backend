const shoeShapes = [
  '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
  '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
  '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
  '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
];
function getShape(sku){if(sku.startsWith('RN'))return 0;if(sku.startsWith('CS'))return 1;if(sku.startsWith('SL'))return 3;return 2;}
let _catalogCache = [];
async function getCatalog(){ _catalogCache = await fetchElevenCatalogAsync(); return _catalogCache; }
function getItemImage(sku){const p = _catalogCache.find(x => x.sku === sku); return (p && p.images && p.images[0]) ? p.images[0] : null;}

async function render() {
  await getCatalog();
  const cart = ELEVEN.getCart();
  const itemsEl = document.getElementById('orderItems');
  const subtotalEl = document.getElementById('subtotalVal');
  const totalEl = document.getElementById('totalVal');
  const discountRowEl = document.getElementById('discountRow');
  const discountLabelEl = document.getElementById('discountLabel');
  const discountValEl = document.getElementById('discountVal');
  const waBtn = document.getElementById('waBtn');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><h3>Your cart is empty</h3><p>Looks like you haven\'t added anything yet.</p><a href="shop.html" class="btn-checkout" style="width:auto;">Start shopping</a></div>';
    if (subtotalEl) subtotalEl.textContent = '—';
    if (totalEl) totalEl.textContent = '—';
    if (discountRowEl) discountRowEl.style.display = 'none';
    if (waBtn) waBtn.disabled = true;
    return;
  }

  itemsEl.innerHTML = cart.map(it => `
    <div class="summary-item">
      <div class="item-art" style="overflow:hidden;">${getItemImage(it.sku) ? `<img src="${getItemImage(it.sku)}" alt="${it.name}" style="width:100%;height:100%;object-fit:cover;display:block;">` : `<svg viewBox="0 0 300 180">${shoeShapes[getShape(it.sku)]}</svg>`}</div>
      <div class="item-info">
        <h5>${it.name}</h5>
        <span>${it.size} · Qty ${it.qty}</span>
      </div>
      <span class="item-price">${ELEVEN.fmt(it.price * it.qty)}</span>
    </div>
  `).join('');

  const subtotal = ELEVEN.cartSubtotal();
  const discountPct = ELEVEN.getDiscountPct();
  const discount = subtotal * (discountPct / 100);
  const total = subtotal - discount;

  if (subtotalEl) subtotalEl.textContent = ELEVEN.fmt(subtotal);
  if (totalEl) totalEl.textContent = ELEVEN.fmt(total);

  if (discountPct > 0) {
    const code = ELEVEN.getCouponCode();
    if (discountRowEl) discountRowEl.style.display = 'flex';
    if (discountLabelEl) discountLabelEl.textContent = code ? `Discount (${code})` : 'Discount';
    if (discountValEl) discountValEl.textContent = '−' + ELEVEN.fmt(discount);
  } else {
    if (discountRowEl) discountRowEl.style.display = 'none';
  }
}

async function orderOnWhatsApp() {
  const cart = ELEVEN.getCart();
  if (cart.length === 0) return;

  const phoneInput = document.getElementById('customerPhone');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const phoneError = document.getElementById('phoneError');
  if (!/^\d{10}$/.test(phone)) {
    if (phoneError) phoneError.style.display = 'block';
    if (phoneInput) phoneInput.focus();
    return;
  }
  if (phoneError) phoneError.style.display = 'none';

  const subtotal = ELEVEN.cartSubtotal();
  const discountPct = ELEVEN.getDiscountPct();
  const discount = subtotal * (discountPct / 100);
  const total = subtotal - discount;
  const code = ELEVEN.getCouponCode();

  const waBtn = document.getElementById('waBtn');
  if (waBtn) { waBtn.disabled = true; waBtn.textContent = 'Placing order…'; }

  // Place the real order in the backend so it shows up for staff and can be tracked.
  let orderId = 'ELV-' + Math.floor(10000 + Math.random() * 90000); // fallback if the API call fails
  try {
    const order = await submitElevenOrder({
      customer_phone: phone,
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
      total: Math.round(total),
      coupon_code: code || '',
      items: cart.map(i => ({ sku: i.sku, name: i.name, size: i.size, price: i.price, qty: i.qty }))
    });
    orderId = order.order_id;
  } catch (err) {
    console.warn('ELEVEN: could not save the order to the backend, continuing with WhatsApp only.', err);
  }

  const itemLines = cart
    .map(i => `  • ${i.name} (${i.size}) ×${i.qty}`)
    .join('\n');

  const msgLines = [
    '🛒 *New Order — ELEVEN Footwear*',
    '─────────────────────',
    `Order ID: ${orderId}`,
    `Phone: ${phone}`,
    '',
    '*Items:*',
    itemLines,
    '─────────────────────',
    'Please confirm my order and share the total. Thank you!'
  ];
  const msg = msgLines.join('\n');

  // Save full snapshot for confirmation page
  localStorage.setItem('eleven_order_id',       orderId);
  localStorage.setItem('eleven_order_phone',    phone);
  localStorage.setItem('eleven_order_snapshot', JSON.stringify(cart));
  localStorage.setItem('eleven_order_subtotal', subtotal);
  localStorage.setItem('eleven_order_discount', discount);
  localStorage.setItem('eleven_order_total_raw', total);
  localStorage.setItem('eleven_order_coupon',   code || '');
  ELEVEN.clearCart(); // also clears any applied discount/coupon

  const waNumber = '917560943996';
  window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(msg), '_blank');
  window.location.href = 'confirmation.html';
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  // If logged in, prefill their phone so they don't retype it.
  const user = ELEVEN_AUTH.getUser();
  const phoneInput = document.getElementById('customerPhone');
  if (user && user.phone && phoneInput && !phoneInput.value) {
    phoneInput.value = user.phone;
  }
});
