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
  const waBtn = document.getElementById('placeOrderBtn');

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

function fieldVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function showFieldError(id, show) {
  const err = document.getElementById('err-' + id);
  if (err) err.classList.toggle('show', !!show);
}
function showOrderError(msg) {
  const el = document.getElementById('orderError');
  if (!el) return;
  if (msg) { el.textContent = msg; el.classList.add('show'); }
  else { el.textContent = ''; el.classList.remove('show'); }
}

async function placeOrder() {
  const cart = ELEVEN.getCart();
  if (cart.length === 0) return;

  const name = fieldVal('customerName');
  const phone = fieldVal('customerPhone');
  const email = fieldVal('customerEmail');
  const addressLine1 = fieldVal('addressLine1');
  const addressLine2 = fieldVal('addressLine2');
  const city = fieldVal('city');
  const state = fieldVal('state');
  const pincode = fieldVal('pincode');

  // Validate — required: name, 10-digit phone, address line 1, city, state, 6-digit pincode.
  // Email is optional but must look like an email if provided.
  let valid = true;
  const checks = [
    ['customerName', name.length > 0],
    ['customerPhone', /^\d{10}$/.test(phone)],
    ['customerEmail', email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)],
    ['addressLine1', addressLine1.length > 0],
    ['city', city.length > 0],
    ['state', state.length > 0],
    ['pincode', /^\d{6}$/.test(pincode)],
  ];
  let firstInvalidId = null;
  checks.forEach(([id, ok]) => {
    showFieldError(id, !ok);
    if (!ok) { valid = false; if (!firstInvalidId) firstInvalidId = id; }
  });
  if (!valid) {
    showOrderError('Please fix the highlighted fields above.');
    const el = document.getElementById(firstInvalidId);
    if (el) el.focus();
    return;
  }
  showOrderError('');

  const subtotal = ELEVEN.cartSubtotal();
  const discountPct = ELEVEN.getDiscountPct();
  const discount = subtotal * (discountPct / 100);
  const total = subtotal - discount;
  const code = ELEVEN.getCouponCode();

  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'razorpay';

  const placeBtn = document.getElementById('placeOrderBtn');
  if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Placing order…'; }

  let order;
  try {
    order = await submitElevenOrder({
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city, state, pincode,
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
      total: Math.round(total),
      coupon_code: code || '',
      payment_method: paymentMethod,
      items: cart.map(i => ({ sku: i.sku, name: i.name, size: i.size, price: i.price, qty: i.qty }))
    });
  } catch (err) {
    console.warn('ELEVEN: order could not be placed.', err);
    showOrderError('Sorry, we could not place your order. Please check your details and try again.');
    if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = paymentMethod === 'cod' ? 'Place order' : 'Proceed to payment'; }
    return;
  }

  const ctx = { name, email, phone, cart, subtotal, discount, total, code };

  if (paymentMethod === 'cod') {
    // Nothing to pay right now — the order is already placed server-side
    // (payment_status stays 'pending' until cash is collected). Go
    // straight to confirmation, same as a successful online payment.
    finishOrder(order, ctx);
    return;
  }

  // Order is saved (payment_status: pending) — now open Razorpay's widget
  // to actually collect payment. Nothing is considered "placed" from the
  // customer's point of view, and the cart isn't cleared, until payment is
  // verified below.
  openRazorpayCheckout(order, ctx);
}

function finishOrder(order, ctx) {
  localStorage.setItem('eleven_order_id',        order.order_id);
  localStorage.setItem('eleven_order_phone',     ctx.phone);
  localStorage.setItem('eleven_order_snapshot',  JSON.stringify(ctx.cart));
  localStorage.setItem('eleven_order_subtotal',  ctx.subtotal);
  localStorage.setItem('eleven_order_discount',  ctx.discount);
  localStorage.setItem('eleven_order_total_raw', ctx.total);
  localStorage.setItem('eleven_order_coupon',    ctx.code || '');
  ELEVEN.clearCart(); // also clears any applied discount/coupon
  window.location.href = 'confirmation.html';
}

function openRazorpayCheckout(order, ctx) {
  const placeBtn = document.getElementById('placeOrderBtn');
  if (typeof Razorpay === 'undefined' || !order.razorpay) {
    showOrderError('Payment could not be started. Please refresh and try again.');
    if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Proceed to payment'; }
    return;
  }

  const rzp = new Razorpay({
    key: order.razorpay.key_id,
    amount: order.razorpay.amount,
    currency: order.razorpay.currency,
    order_id: order.razorpay.razorpay_order_id,
    name: 'ELEVEN',
    description: 'Order ' + order.order_id,
    prefill: { name: ctx.name, email: ctx.email, contact: ctx.phone },
    theme: { color: '#2F6FED' },
    handler: async function (response) {
      if (placeBtn) placeBtn.textContent = 'Confirming payment…';
      try {
        await verifyElevenPayment({
          order_id: order.order_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err) {
        console.warn('ELEVEN: payment verification failed.', err);
        showOrderError(
          'Payment went through but we could not confirm it automatically. ' +
          'Please contact us with your order ID: ' + order.order_id
        );
        if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Proceed to payment'; }
        return;
      }

      localStorage.setItem('eleven_order_id',        order.order_id);
      localStorage.setItem('eleven_order_phone',     ctx.phone);
      localStorage.setItem('eleven_order_snapshot',  JSON.stringify(ctx.cart));
      localStorage.setItem('eleven_order_subtotal',  ctx.subtotal);
      localStorage.setItem('eleven_order_discount',  ctx.discount);
      localStorage.setItem('eleven_order_total_raw', ctx.total);
      localStorage.setItem('eleven_order_coupon',    ctx.code || '');
      ELEVEN.clearCart(); // also clears any applied discount/coupon
      window.location.href = 'confirmation.html';
    },    modal: {
      // Customer closed the Razorpay popup without paying. The order row
      // already exists with payment_status 'pending' — nothing lost, they
      // can just try again.
      ondismiss: function () {
        showOrderError('Payment was not completed. You can try again whenever you\'re ready.');
        if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Proceed to payment'; }
      }
    }
  });

  rzp.on('payment.failed', function (response) {
    const reason = (response && response.error && response.error.description) || 'please try again.';
    showOrderError('Payment failed: ' + reason);
    if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Proceed to payment'; }
  });

  rzp.open();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  // If logged in, prefill their details so they don't retype them.
  const user = ELEVEN_AUTH.getUser();
  if (user) {
    const phoneInput = document.getElementById('customerPhone');
    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    if (user.phone && phoneInput && !phoneInput.value) phoneInput.value = user.phone;
    if (user.name && nameInput && !nameInput.value) nameInput.value = user.name;
    if (user.email && emailInput && !emailInput.value) emailInput.value = user.email;
  }

  // Swap the button label to match the selected payment method.
  const placeBtn = document.getElementById('placeOrderBtn');
  document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
    input.addEventListener('change', () => {
      if (placeBtn && !placeBtn.disabled) {
        placeBtn.textContent = input.value === 'cod' ? 'Place order' : 'Proceed to payment';
      }
    });
  });
});
