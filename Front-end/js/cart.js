const shoeShapes = [
    '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
    '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
    '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
    '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
  ];

  let discountPct = Number(localStorage.getItem('eleven_discount')) || 0;

  function getShape(sku) {
    if(sku.startsWith('RN')) return 0;
    if(sku.startsWith('CS')) return 1;
    if(sku.startsWith('SL')) return 3;
    return 2;
  }

  let _catalogCache = [];
  async function getCatalog(){
    _catalogCache = await fetchElevenCatalogAsync();
    return _catalogCache;
  }
  function getItemImage(sku){
    const p = _catalogCache.find(x => x.sku === sku);
    return (p && p.images && p.images[0]) ? p.images[0] : null;
  }

  async function renderCart(){
    await getCatalog();
    const cart = ELEVEN.getCart();
    const container = document.getElementById('cartItems');
    const empty = document.getElementById('emptyCart');
    const actionsRow = document.getElementById('cartActionsRow');
    const checkoutBtn = document.querySelector('.btn-checkout');

    if(cart.length === 0){
      container.innerHTML = '';
      empty.style.display = 'flex';
      actionsRow.style.display = 'none';
      if(checkoutBtn) checkoutBtn.style.pointerEvents = 'none';
    } else {
      empty.style.display = 'none';
      actionsRow.style.display = 'flex';
      if(checkoutBtn) checkoutBtn.style.pointerEvents = '';
      container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
          <div class="item-art" onclick="window.location.href='product.html?sku=${item.sku}'" style="cursor:pointer; overflow:hidden;">
            ${getItemImage(item.sku) ? `<img src="${getItemImage(item.sku)}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;display:block;">` : `<svg viewBox="0 0 300 180">${shoeShapes[getShape(item.sku)]}</svg>`}
          </div>
          <div class="item-info">
            <span class="mono">ELV-${item.sku}</span>
            <h4>${item.name}</h4>
            <div class="item-meta"><span>${item.size}</span>${item.color ? `<span>${item.color}</span>` : ''}</div>
            <button class="item-remove" onclick="removeItem('${item.sku}','${item.size}')">Remove</button>
          </div>
          <div class="item-right">
            <span class="item-price">${ELEVEN.fmt(item.price * item.qty)}</span>
            <div class="qty-control">
              <button onclick="ELEVEN.changeQty('${item.sku}','${item.size}',-1); renderCart();" aria-label="Decrease">−</button>
              <span>${item.qty}</span>
              <button onclick="ELEVEN.changeQty('${item.sku}','${item.size}',1); renderCart();" aria-label="Increase">+</button>
            </div>
          </div>
        </div>
      `).join('');
    }
    updateSummary();
  }

  function removeItem(sku, size){
    ELEVEN.removeFromCart(sku, size);
    renderCart();
  }
  function clearCart(){
    ELEVEN.clearCart(); // also clears any applied discount/coupon
    discountPct = 0;
    document.getElementById('couponInput').value = '';
    document.getElementById('couponRow').style.display = 'flex';
    document.getElementById('couponApplied').style.display = 'none';
    renderCart();
  }
  function applyCoupon(){
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    if(code === 'BUILT10'){
      discountPct = 10;
      document.getElementById('couponRow').style.display = 'none';
      document.getElementById('couponApplied').style.display = 'flex';
    } else if(code.length > 0){
      ELEVEN.showToast('Invalid or expired code.');
    }
    updateSummary();
  }
  function removeCoupon(){
    discountPct = 0;
    document.getElementById('couponInput').value = '';
    document.getElementById('couponRow').style.display = 'flex';
    document.getElementById('couponApplied').style.display = 'none';
    ELEVEN.clearDiscount();
    updateSummary();
  }
  function updateSummary(){
    const subtotal = ELEVEN.cartSubtotal();
    const discount = subtotal * (discountPct/100);
    const total = subtotal - discount;
    document.getElementById('subtotalVal').textContent = ELEVEN.fmt(subtotal);
    document.getElementById('totalVal').textContent = ELEVEN.fmt(total);
    document.getElementById('shippingVal').textContent = subtotal > 0 ? 'Free' : '—';
    if(discountPct > 0){
      document.getElementById('discountRow').style.display = 'flex';
      document.getElementById('discountVal').textContent = '−' + ELEVEN.fmt(discount);
    } else {
      document.getElementById('discountRow').style.display = 'none';
    }
    // Save discount state for checkout
    ELEVEN.setDiscount(discountPct, 'BUILT10');
  }

  if(discountPct > 0){
    document.getElementById('couponRow').style.display = 'none';
    document.getElementById('couponApplied').style.display = 'flex';
  }

  (async function(){
    await renderCart();

    // Related products — pulled from the real catalog, excluding items already in cart
    const cartSkus = ELEVEN.getCart().map(it => it.sku);
    const relatedGrid = document.getElementById('relatedGrid');
    const relatedItems = _catalogCache.filter(p => !cartSkus.includes(p.sku)).slice(0, 4);
    relatedItems.forEach((p)=>{
      const div = document.createElement('div');
      div.className='product-card'; div.onclick=()=>window.location.href='product.html?sku='+p.sku; div.style.cursor='pointer';
      const img = (p.images && p.images[0]) ? p.images[0] : '';
      div.innerHTML=`<div class="card-art" style="overflow:hidden;">${img ? `<img src="${img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">` : `<svg viewBox="0 0 300 180">${shoeShapes[getShape(p.sku)]}</svg>`}</div><div class="card-body"><span class="mono">ELV-${p.sku}</span><h4>${p.name}</h4><span class="card-price">${ELEVEN.fmt(p.price)}</span></div>`;
      relatedGrid.appendChild(div);
    });
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
