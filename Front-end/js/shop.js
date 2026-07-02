function addQuick(p) {
    ELEVEN.addToCart({ sku: p.sku, name: p.name, size: 'UK ' + ((p.sizes && p.sizes[0]) || 8), color: p.colorway || 'Charcoal', price: p.price, shape: 0, image: (p.images && p.images[0]) || '' });
    ELEVEN.showToast(p.name + ' added to cart');
  }

  function getSortedProducts(products) {
    const sort = document.getElementById('sortSelect').value;
    const arr = [...products];
    if(sort === 'newest') arr.sort((a,b) => (b.isNew?1:0)-(a.isNew?1:0));
    return arr;
  }

  async function renderProducts() {
    const catalog = await fetchElevenCatalogAsync();
    const sorted = getSortedProducts(catalog);
    const grid = document.getElementById('productGrid');
    document.getElementById('resultCount').textContent = sorted.length + ' result' + (sorted.length===1?'':'s');

    if(sorted.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; padding:60px 0; text-align:center; color:var(--steel-dim);"><p style="font-size:14px;">No products yet.</p></div>';
      return;
    }

    grid.innerHTML = sorted.map(p => {
      const inWish = ELEVEN.isWished(p.sku);
      const img = (p.images && p.images[0]) || '';
      return `
      <div class="product-card" style="cursor:pointer;" onclick="window.location.href='product.html?sku=${p.sku}'" data-sku="${p.sku}">
        <div class="card-art" style="overflow:hidden;">
          ${p.isNew ? '<span class="badge">New</span>' : (p.onSale ? '<span class="badge sale">Sale</span>' : '')}
          <button class="card-wishlist ${inWish?'wishlisted':''}" aria-label="${inWish?'Remove from wishlist':'Add to wishlist'}" onclick="event.stopPropagation(); toggleWish('${p.sku}', this)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${inWish?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          ${img ? `<img src="${img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">` : ''}
        </div>
        <div class="card-body">
          <div class="brand-tag">${p.brand || ''}</div>
          <h4>${p.name}</h4>
          <div class="card-sizes">${(p.sizes||[]).map(s=>`<span class="size-pip">UK ${s}</span>`).join('')}</div>
          <div class="card-price-row">
            <span class="card-price">${elevenFmtPrice(p.price)}</span>
            <button class="quick-add" onclick="event.stopPropagation(); addQuick(${JSON.stringify(p).replace(/"/g,'&quot;')})">Add</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function toggleWish(sku, btn) {
    const nowInWish = ELEVEN.toggleWish(sku);
    btn.classList.toggle('wishlisted', nowInWish);
    btn.setAttribute('aria-label', nowInWish ? 'Remove from wishlist' : 'Add to wishlist');
    btn.querySelector('svg').setAttribute('fill', nowInWish ? 'currentColor' : 'none');
    ELEVEN.showToast(nowInWish ? 'Added to wishlist' : 'Removed from wishlist');
  }

  document.getElementById('sortSelect').addEventListener('change', renderProducts);

  renderProducts();

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
