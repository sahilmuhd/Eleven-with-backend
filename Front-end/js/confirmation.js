function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Populate confirmation from the real order (fetched from the backend),
// falling back to the localStorage snapshot saved right after checkout
// if the order can't be reached (offline, etc.) — same pattern used
// elsewhere on the site so the page never goes blank.
(async function(){
  var STATUS_STEPS = [
    { key: 'placed',            label: 'Order placed' },
    { key: 'processing',        label: 'Processing' },
    { key: 'shipped',           label: 'Shipped' },
    { key: 'out_for_delivery',  label: 'Out for delivery' },
    { key: 'delivered',         label: 'Delivered' },
  ];

  var orderId = localStorage.getItem('eleven_order_id');
  var phone   = localStorage.getItem('eleven_order_phone');

  var order = null;
  if (orderId && phone && typeof trackElevenOrder === 'function') {
    try { order = await trackElevenOrder(orderId, phone); }
    catch (e) { console.warn('ELEVEN: could not fetch order for confirmation page.', e); }
  }

  // ---- Fallback snapshot (used only if the real order couldn't be fetched) ----
  var snapshot     = JSON.parse(localStorage.getItem('eleven_order_snapshot') || 'null');
  var fallSubtotal = Number(localStorage.getItem('eleven_order_subtotal') || 0);
  var fallDiscount = Number(localStorage.getItem('eleven_order_discount') || 0);
  var fallTotal    = Number(localStorage.getItem('eleven_order_total_raw') || 0);
  var fallCoupon   = localStorage.getItem('eleven_order_coupon') || '';

  var displayId   = order ? order.order_id : (orderId || ('ELV-' + Math.floor(10000 + Math.random() * 90000)));
  var subtotal    = order ? order.subtotal : fallSubtotal;
  var discount    = order ? order.discount : fallDiscount;
  var total       = order ? order.total    : fallTotal;
  var coupon      = order ? order.coupon_code : fallCoupon;
  var items       = order ? order.items : snapshot;
  var status      = order ? order.status : 'placed';
  var paymentMethod = order ? order.payment_method : 'razorpay';
  var paymentStatus = order ? order.payment_status : 'paid';
  var createdAt   = order ? new Date(order.created_at) : new Date();

  // ---- Order number / placed date / estimated delivery ----
  var idEl = document.getElementById('conf-order-id');
  if (idEl) idEl.textContent = displayId;

  var placedEl = document.getElementById('conf-placed-on');
  if (placedEl) {
    placedEl.textContent = createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  var etaEl = document.getElementById('conf-eta');
  var etaLabelEl = document.getElementById('conf-eta-label');
  if (etaEl) {
    if (status === 'delivered') {
      if (etaLabelEl) etaLabelEl.textContent = 'Delivered on';
      etaEl.textContent = createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (status === 'cancelled') {
      if (etaLabelEl) etaLabelEl.textContent = 'Status';
      etaEl.textContent = 'Cancelled';
    } else {
      var etaStart = new Date(createdAt); etaStart.setDate(etaStart.getDate() + 3);
      var etaEnd   = new Date(createdAt); etaEnd.setDate(etaEnd.getDate() + 6);
      var fmtShort = function(d){ return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
      etaEl.textContent = fmtShort(etaStart) + '–' + fmtShort(etaEnd);
    }
  }

  // ---- Timeline ----
  var timelineEl = document.getElementById('conf-timeline');
  if (timelineEl) {
    if (status === 'cancelled') {
      timelineEl.classList.add('single');
      timelineEl.style.justifyContent = 'center';
      timelineEl.innerHTML =
        '<div class="timeline-step cancelled" style="flex:none;">' +
        '<div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>' +
        '<span class="lbl">Order cancelled</span>' +
        '</div>';
    } else {
      var currentIdx = STATUS_STEPS.findIndex(function(s){ return s.key === status; });
      if (currentIdx === -1) currentIdx = 0;
      timelineEl.innerHTML = STATUS_STEPS.map(function(step, i){
        var cls = i < currentIdx ? 'done' : (i === currentIdx ? 'done active' : '');
        var icon = i <= currentIdx
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
          : '';
        return '<div class="timeline-step ' + cls + '">' +
          '<div class="timeline-dot">' + icon + '</div>' +
          '<span class="lbl">' + step.label + '</span>' +
          '</div>';
      }).join('');
    }
  }

  // ---- Hero copy: differentiate COD vs prepaid ----
  var heroP = document.querySelector('.confirm-hero p');
  if (heroP) {
    heroP.textContent = paymentMethod === 'cod'
      ? 'A confirmation has been sent to your email. Please keep ' + ELEVEN.fmt(total) + ' ready in cash for delivery.'
      : 'A confirmation has been sent to your email. We\'ll notify you again the moment your pair ships from Bangalore.';
  }

  // ---- Items ----
  var itemsEl = document.getElementById('orderItems');
  var catalog = await fetchElevenCatalogAsync();
  function imgFor(sku){ var p = catalog.find(function(x){ return x.sku === sku; }); return (p && p.images && p.images[0]) ? p.images[0] : null; }
  if (itemsEl && items && items.length) {
    itemsEl.innerHTML = items.map(function(it){
      var img = imgFor(it.sku);
      return '<div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid var(--line);font-size:13px;">'
        + '<div class="item-art" style="overflow:hidden;">' + (img ? '<img src="'+img+'" alt="'+esc(it.name)+'" style="width:100%;height:100%;object-fit:cover;display:block;">' : '') + '</div>'
        + '<span style="flex:1;display:flex;justify-content:space-between;"><strong>'+esc(it.name)+'</strong> &middot; '+esc(it.size)+' &times;'+it.qty+'</span>'
        + '</div>';
    }).join('');
  }

  // ---- Totals ----
  var totalsEl = document.getElementById('conf-totals');
  if (totalsEl) {
    var rows = '<div class="totals-row"><span>Subtotal</span><span class="mono">&#x20B9;'+Math.round(subtotal).toLocaleString('en-IN')+'</span></div>';
    if (discount > 0) {
      rows += '<div class="totals-row"><span>Discount'+(coupon?' ('+esc(coupon)+')':'')+'</span><span class="mono" style="color:var(--gold);">&minus;&#x20B9;'+Math.round(discount).toLocaleString('en-IN')+'</span></div>';
    }
    rows += '<div class="totals-row"><span>Shipping</span><span class="mono">Free</span></div>';
    var totalLabel = paymentMethod === 'cod' ? 'Pay on delivery' : (paymentStatus === 'paid' ? 'Total paid' : 'Total');
    rows += '<div class="totals-row total"><span>'+totalLabel+'</span><span class="mono">&#x20B9;'+Math.round(total).toLocaleString('en-IN')+'</span></div>';
    totalsEl.innerHTML = rows;
  }
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

/* ---- next inline block ---- */

(function(){
  var SELECTORS = '.product-card, .why-item, .collection-tile, .section-head, .about-stat, .contact-card, .faq-item, .drop-banner, .cd-item';
  var observed = new WeakSet();

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        // stagger siblings in the same parent
        var siblings = Array.from(e.target.parentNode.children).filter(function(c){ return c.classList.contains('sr'); });
        var idx = siblings.indexOf(e.target);
        e.target.style.transitionDelay = (idx * 70) + 'ms';
        e.target.classList.add('sr-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function attach(){
    document.querySelectorAll(SELECTORS).forEach(function(el){
      if(!observed.has(el)){
        observed.add(el);
        el.classList.add('sr');
        io.observe(el);
      }
    });
  }

  // Initial attach
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // Re-scan for JS-rendered cards (shop, new-arrivals)
  var scans = 0;
  var scanner = setInterval(function(){
    attach();
    if(++scans >= 8) clearInterval(scanner);
  }, 400);
})();

/* ---- next inline block ---- */

/* ========== ELEVEN — shared enhancement effects ========== */

/* NAV LOGO SCRAMBLE — home page only */

/* MAGNETIC BUTTONS */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width/2)  * 0.22;
      var y = (e.clientY - r.top  - r.height/2) * 0.28;
      btn.style.transform = 'translate('+x+'px,'+y+'px)';
    });
    btn.addEventListener('mouseleave', function(){
      btn.style.transform = '';
    });
  });
})();

/* 3D CARD TILT */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  document.querySelectorAll('.product-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left)/r.width  - 0.5;
      var y = (e.clientY - r.top) /r.height - 0.5;
      card.style.transform = 'perspective(700px) rotateY('+(x*10)+'deg) rotateX('+(-y*7)+'deg) translateZ(4px)';
    });
    card.addEventListener('mouseleave', function(){
      card.style.transform = '';
    });
  });
})();

/* SMOOTH ANCHOR SCROLL */
(function(){
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(a.getAttribute('href'));
      if(!target) return;
      e.preventDefault();
      var navH = (document.querySelector('nav')||{offsetHeight:72}).offsetHeight;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY - navH - 12, behavior:'smooth'});
    });
  });
})();
