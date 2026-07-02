/* ===== ELEVEN — track order page =====
   Looks up a real order via POST /api/track/ (order_id + phone) and renders
   its current status as a timeline, plus the items and totals. */

const STATUS_STEPS = [
  { key: 'placed',           label: 'Order placed',      icon: 'check' },
  { key: 'processing',       label: 'Processing',        icon: 'check' },
  { key: 'shipped',          label: 'Shipped',           icon: 'check' },
  { key: 'out_for_delivery', label: 'Out for delivery',  icon: 'check' },
  { key: 'delivered',        label: 'Delivered',         icon: 'check' },
];

const STATUS_LABELS = {
  placed: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_HEADLINES = {
  placed: "Thanks — it's on the way.",
  processing: "We're getting your order ready.",
  shipped: "Your order has shipped!",
  out_for_delivery: "Almost there — out for delivery.",
  delivered: "Delivered — enjoy your pair!",
  cancelled: "This order was cancelled.",
};

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtDate(iso){
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(e){ return iso; }
}

function renderTimeline(status){
  const track = document.getElementById('timelineTrack');
  const section = document.getElementById('timelineSection');
  const cancelledBanner = document.getElementById('cancelledBanner');

  if(status === 'cancelled'){
    section.style.display = 'none';
    cancelledBanner.style.display = 'block';
    return;
  }
  section.style.display = '';
  cancelledBanner.style.display = 'none';

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  track.innerHTML = STATUS_STEPS.map((s, i) => {
    const done = currentIdx >= 0 && i <= currentIdx;
    return `
    <div class="timeline-step ${done ? 'done' : ''}">
      <div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
      <span class="lbl">${esc(s.label)}</span>
    </div>`;
  }).join('');
}

async function renderOrderItems(items){
  const itemsEl = document.getElementById('orderItems');
  if(!items || !items.length){
    itemsEl.innerHTML = '<div style="padding:18px 24px; font-size:13px; color:var(--steel-dim);">No items on this order.</div>';
    return;
  }
  const catalog = await fetchElevenCatalogAsync();
  function imgFor(sku){
    const p = catalog.find(x => x.sku === sku);
    return (p && p.images && p.images[0]) ? p.images[0] : null;
  }
  itemsEl.innerHTML = items.map(function(it){
    const img = imgFor(it.sku);
    return '<div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid var(--line);font-size:13px;">'
      + '<div class="item-art" style="overflow:hidden;">' + (img ? '<img src="'+img+'" alt="'+esc(it.name)+'" style="width:100%;height:100%;object-fit:cover;display:block;">' : '') + '</div>'
      + '<span style="flex:1;display:flex;justify-content:space-between;"><strong>'+esc(it.name)+'</strong> &middot; '+esc(it.size)+' &times;'+it.qty+'</span>'
      + '</div>';
  }).join('');
}

function renderTotals(order){
  const totalsEl = document.getElementById('conf-totals');
  let rows = '<div class="totals-row"><span>Subtotal</span><span class="mono">&#x20B9;'+Number(order.subtotal).toLocaleString('en-IN')+'</span></div>';
  if(order.discount > 0){
    rows += '<div class="totals-row"><span>Discount'+(order.coupon_code ? ' ('+esc(order.coupon_code)+')' : '')+'</span><span class="mono" style="color:var(--gold);">&minus;&#x20B9;'+Number(order.discount).toLocaleString('en-IN')+'</span></div>';
  }
  rows += '<div class="totals-row"><span>Shipping</span><span class="mono">Free</span></div>';
  rows += '<div class="totals-row total"><span>Total paid</span><span class="mono">&#x20B9;'+Number(order.total).toLocaleString('en-IN')+'</span></div>';
  totalsEl.innerHTML = rows;
}

async function lookupOrder(){
  const orderIdInput = document.getElementById('orderIdInput');
  const phoneInput = document.getElementById('phoneInput');
  const errorEl = document.getElementById('lookupError');
  const btn = document.getElementById('lookupBtn');
  const results = document.getElementById('trackResults');

  const orderId = orderIdInput.value.trim();
  const phone = phoneInput.value.trim();

  errorEl.classList.remove('show');
  results.classList.remove('show');

  if(!orderId || !phone){
    errorEl.textContent = 'Please enter both your order ID and phone number.';
    errorEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Looking up…';

  let order = null;
  try {
    order = await trackElevenOrder(orderId, phone);
  } catch(err) {
    console.warn('ELEVEN: order lookup failed', err);
  }

  btn.disabled = false;
  btn.textContent = 'Track order';

  if(!order){
    errorEl.textContent = 'No order found with that order ID and phone number. Double-check both and try again.';
    errorEl.classList.add('show');
    return;
  }

  document.getElementById('resOrderId').textContent = order.order_id;
  document.getElementById('resPlacedOn').textContent = fmtDate(order.created_at);
  document.getElementById('resStatus').textContent = STATUS_LABELS[order.status] || order.status;
  document.getElementById('statusEyebrow').textContent = order.status === 'cancelled' ? 'Order cancelled' : 'Order status';
  document.getElementById('statusHeadline').textContent = STATUS_HEADLINES[order.status] || "Here's your order status.";
  document.getElementById('statusRing').style.color = order.status === 'cancelled' ? '#e05252' : '';

  renderTimeline(order.status);
  renderTotals(order);
  await renderOrderItems(order.items);

  results.classList.add('show');
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('orderIdInput').addEventListener('keydown', e => { if(e.key === 'Enter') lookupOrder(); });
document.getElementById('phoneInput').addEventListener('keydown', e => { if(e.key === 'Enter') lookupOrder(); });

/* Auto-fill and auto-run if we just placed an order in this browser */
(function(){
  const savedOrderId = localStorage.getItem('eleven_order_id');
  const savedPhone = localStorage.getItem('eleven_order_phone');
  if(savedOrderId) document.getElementById('orderIdInput').value = savedOrderId;
  if(savedPhone) document.getElementById('phoneInput').value = savedPhone;
  if(savedOrderId && savedPhone) lookupOrder();
})();

/* ---- next inline block ---- */

(function(){
  var nav = document.querySelector('nav');
  if(!nav) return;
  function checkScroll(){
    nav.classList.toggle('nav-scrolled', window.scrollY > 50);
  }
  window.addEventListener('scroll', checkScroll, {passive:true});
  checkScroll();
})();
