const angles = [
    '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
    '<ellipse cx="150" cy="100" rx="130" ry="50" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><ellipse cx="150" cy="95" rx="90" ry="28" fill="#222224"/>',
    '<path d="M40 140 L60 60 L240 60 L260 140 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><line x1="80" y1="60" x2="80" y2="140" stroke="#4a4a4d"/><line x1="150" y1="55" x2="150" y2="140" stroke="#4a4a4d"/><line x1="220" y1="60" x2="220" y2="140" stroke="#4a4a4d"/>',
    '<path d="M30 120 C30 95 80 80 150 78 C220 80 270 95 270 120 L260 150 L40 150 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
    '<circle cx="150" cy="95" r="70" fill="none" stroke="#4a4a4d" stroke-width="1.5"/><path d="M90 95 Q150 60 210 95 Q150 130 90 95 Z" fill="#2a2a2c"/>',
    '<rect x="40" y="70" width="220" height="60" rx="28" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><circle cx="100" cy="100" r="6" fill="#4a4a4d"/><circle cx="140" cy="100" r="6" fill="#4a4a4d"/><circle cx="180" cy="100" r="6" fill="#4a4a4d"/><circle cx="220" cy="100" r="6" fill="#4a4a4d"/>'
  ];
  let currentImg = 0;
  const mainSvg = document.getElementById('mainSvg');

  function renderThumbs(){
    document.getElementById('thumbRow').innerHTML = angles.map((a,i)=>`<div class="thumb ${i===currentImg?'active':''}" onclick="setImage(${i})"><svg viewBox="0 0 300 180">${a}</svg></div>`).join('');
  }
  function setImage(i){ currentImg=i; mainSvg.innerHTML=angles[i]; document.getElementById('galleryMain').classList.remove('zoomed'); renderThumbs(); }
  function shiftImage(dir){ setImage((currentImg+dir+angles.length)%angles.length); }
  renderThumbs();

  // ===== SIZE SELECTION =====
  let selectedSize = null;
  const sizeBtns = document.querySelectorAll('.size-btn-pdp:not(.oos)');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = 'UK ' + btn.textContent.trim();
      document.getElementById('sizeError').style.display = 'none';
      document.getElementById('stickySize').textContent = 'Stride Runner · ' + selectedSize;
    });
  });
  // Pre-select UK 7 (already marked selected in HTML)
  const preSelected = document.querySelector('.size-btn-pdp.selected');
  if(preSelected) selectedSize = 'UK ' + preSelected.textContent.trim();

  // ===== COLOR SELECTION =====
  const colorSwatches = document.querySelectorAll('.color-swatch');
  let selectedColor = 'Charcoal';
  colorSwatches.forEach(sw => {
    sw.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedColor = sw.title;
      document.querySelector('.selector-block .selector-label h4').textContent = 'Colour — ' + selectedColor;
    });
  });

  // ===== SIZE ERROR BANNER =====
  const sizeErrDiv = document.createElement('div');
  sizeErrDiv.id = 'sizeError';
  sizeErrDiv.style.cssText = 'display:none;color:#e05252;font-size:12px;margin-bottom:12px;padding:10px 14px;border:1px solid #e05252;';
  sizeErrDiv.textContent = 'Please select a size before adding to cart.';
  document.querySelector('.qty-cart-row').before(sizeErrDiv);

  // ===== ADD TO CART =====
  function addToCartPDP() {
    if (!selectedSize) {
      document.getElementById('sizeError').style.display = 'block';
      document.querySelector('.size-grid-pdp').scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }
    const qty = parseInt(document.getElementById('qty').textContent) || 1;
    ELEVEN.addToCart({
      sku: 'RN-001', name: 'Stride Runner', size: selectedSize,
      color: selectedColor, price: 6499, shape: 0
    });
    // Override qty if > 1
    if(qty > 1) {
      const cart = ELEVEN.getCart();
      const idx = cart.findIndex(i => i.sku === 'RN-001' && i.size === selectedSize);
      if(idx >= 0) { cart[idx].qty = qty; ELEVEN.saveCart(cart); }
    }
    ELEVEN.showToast('Stride Runner added to cart');
    ELEVEN.updateAllBadges();
  }

  function buyNow() {
    if (!selectedSize) {
      document.getElementById('sizeError').style.display = 'block';
      document.querySelector('.size-grid-pdp').scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }
    addToCartPDP();
    window.location.href = 'checkout.html';
  }

  // Replace inline onclick handlers
  document.querySelector('.btn-add-cart').onclick = addToCartPDP;
  document.querySelector('.btn-buy-now').onclick = buyNow;
  // Sticky bar
  document.querySelector('.sticky-bar .btn-add-cart').onclick = addToCartPDP;

  // ===== WISHLIST =====
  const wishBtn = document.querySelector('.icon-row button');
  function updateWishBtn() {
    const inWish = ELEVEN.isWished('RN-001');
    wishBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${inWish?'currentColor':'none'}" stroke="currentColor" stroke-width="2" style="color:${inWish?'var(--gold)':'currentColor'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ${inWish ? 'Saved' : 'Wishlist'}`;
  }
  wishBtn.addEventListener('click', () => {
    ELEVEN.toggleWish('RN-001');
    updateWishBtn();
    ELEVEN.showToast(ELEVEN.isWished('RN-001') ? 'Added to wishlist' : 'Removed from wishlist');
  });
  updateWishBtn();

  // ===== RELATED GRIDS =====
  const shoeShapes = [
    '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
    '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
    '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
    '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
  ];
  function buildCard(name, sku, price, shapeIdx){
    const div = document.createElement('div');
    div.className='product-card'; div.style.cursor='pointer';
    div.onclick = () => window.location.href='product.html';
    div.innerHTML=`<div class="card-art"><svg viewBox="0 0 300 180">${shoeShapes[shapeIdx%shoeShapes.length]}</svg></div><div class="card-body"><span class="mono">ELV-${sku}</span><h4>${name}</h4><span class="card-price">₹${price.toLocaleString('en-IN')}</span></div>`;
    return div;
  }
  [['Velocity Mid','RN-007',5299,2],['Apex Trainer','RN-012',7299,0],['Sector One','CS-009',4599,1],['Glide Pro','RN-018',6899,3]].forEach(([n,s,p,sh])=>document.getElementById('relatedGrid').appendChild(buildCard(n,s,p,sh)));
  [['Off-Court Low','CS-014',4999,1],['Drift Slide','SL-002',2199,3],['Form Low','CS-021',5099,1],['Loop Mid','CS-017',4799,2]].forEach(([n,s,p,sh])=>document.getElementById('recentGrid').appendChild(buildCard(n,s,p,sh)));

  // ===== STICKY BAR =====
  const stickyBar = document.getElementById('stickyBar');
  const stickyLabel = document.createElement('span');
  stickyLabel.id = 'stickySize';
  stickyLabel.className = 'mono';
  stickyLabel.style.fontSize = '13px';
  stickyLabel.textContent = 'Stride Runner · ' + (selectedSize || 'Select size');
  stickyBar.querySelector('.sticky-bar-left div').innerHTML = '<h6>Stride Runner</h6>';
  stickyBar.querySelector('.sticky-bar-left div').appendChild(stickyLabel);

  window.addEventListener('scroll', () => {
    stickyBar.classList.toggle('show', window.scrollY > 600);
  });

/* ---- next inline block ---- */

/* ===== REAL PRODUCT OVERRIDE — runs if ?sku= matches a real product ===== */
(async function(){
  var params = new URLSearchParams(window.location.search);
  var sku = params.get('sku');
  if(!sku) return;
  var p = await fetchElevenProductAsync(sku);
  if(!p) return;
  var REAL_CATALOG = await fetchElevenCatalogAsync();

  // ---- Title, breadcrumb, SKU ----
  document.title = p.name + ' — ELEVEN';
  var crumb = document.querySelector('.breadcrumb');
  if(crumb) crumb.innerHTML = '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html">'+ (p.cats[0]||'Shop') +'</a> / <span>'+ p.name +'</span>';
  var skuEl = document.querySelector('.product-info .sku');
  if(skuEl) skuEl.textContent = 'ELV-' + p.sku;
  var h1 = document.querySelector('.product-info h1');
  if(h1) h1.textContent = p.name;

  // ---- Brand tag (insert under h1 if not present) ----
  if(h1 && !document.getElementById('brandTag')){
    var bt = document.createElement('div');
    bt.id = 'brandTag';
    bt.style.cssText = 'font-size:12px; color:var(--gold); letter-spacing:0.06em; text-transform:uppercase; margin:-4px 0 10px; font-weight:600;';
    bt.textContent = p.brand + ' · ' + p.colorway;
    h1.after(bt);
  }

  // ---- Price ----
  var priceNow = document.querySelector('.price-now');
  var priceStrike = document.querySelector('.price-strike');
  var priceSave = document.querySelector('.price-save');
  if(priceNow) priceNow.textContent = elevenFmtPrice(p.price);
  if(p.strike && p.strike > p.price){
    if(priceStrike){ priceStrike.textContent = elevenFmtPrice(p.strike); priceStrike.style.display=''; }
    if(priceSave){ priceSave.textContent = 'Save ' + Math.round((1-p.price/p.strike)*100) + '%'; priceSave.style.display=''; }
  } else {
    if(priceStrike) priceStrike.style.display = 'none';
    if(priceSave) priceSave.style.display = 'none';
  }

  // ---- Gallery: replace SVG render with real photos ----
  var galleryMain = document.getElementById('galleryMain');
  var thumbRow = document.getElementById('thumbRow');
  var badge = galleryMain ? galleryMain.querySelector('.gallery-badge') : null;
  if(badge){ badge.style.display = p.isNew ? '' : 'none'; if(p.isNew) badge.textContent = 'New'; }

  var imgIdx = 0;
  function renderRealMain(){
    var mainSvg = document.getElementById('mainSvg');
    if(mainSvg) mainSvg.style.display = 'none';

    // Blurred, zoomed-in backdrop of the same photo — fills the frame with
    // no empty bars, while the crisp foreground photo stays fully visible.
    var bg = document.getElementById('mainPhotoBg');
    if(!bg){
      bg = document.createElement('div');
      bg.id = 'mainPhotoBg';
      bg.style.cssText = 'position:absolute; inset:0; background-size:cover; background-position:center; filter:blur(28px) brightness(0.6) saturate(1.1); transform:scale(1.25); z-index:0;';
      galleryMain.insertBefore(bg, galleryMain.firstChild);
    }

    var existingImg = document.getElementById('mainPhoto');
    if(!existingImg){
      existingImg = document.createElement('img');
      existingImg.id = 'mainPhoto';
      existingImg.style.cssText = 'width:100%; height:100%; object-fit:contain; display:block; position:relative; z-index:1;';
      galleryMain.insertBefore(existingImg, galleryMain.querySelector('.gallery-nav-btn.next'));
    }
    existingImg.src = p.images[imgIdx];
    existingImg.alt = p.name + ' — angle ' + (imgIdx+1);
    bg.style.backgroundImage = 'url(' + p.images[imgIdx] + ')';
  }
  function renderRealThumbs(){
    thumbRow.innerHTML = p.images.map(function(src, i){
      return '<div class="thumb '+(i===imgIdx?'active':'')+'" onclick="window.__elevenSetRealImage('+i+')">'
        + '<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;display:block;" alt="'+p.name+' thumbnail '+(i+1)+'">'
        + '</div>';
    }).join('');
  }
  window.__elevenSetRealImage = function(i){
    imgIdx = i;
    renderRealMain();
    renderRealThumbs();
    galleryMain.classList.remove('zoomed');
  };
  // Override prev/next buttons
  var prevBtn = galleryMain.querySelector('.gallery-nav-btn.prev');
  var nextBtn = galleryMain.querySelector('.gallery-nav-btn.next');
  if(prevBtn) prevBtn.onclick = function(e){ e.stopPropagation(); window.__elevenSetRealImage((imgIdx-1+p.images.length)%p.images.length); };
  if(nextBtn) nextBtn.onclick = function(e){ e.stopPropagation(); window.__elevenSetRealImage((imgIdx+1)%p.images.length); };
  renderRealMain();
  renderRealThumbs();

  // ---- Hide color swatches (real products have one true colorway) ----
  var selectorBlocks = document.querySelectorAll('.selector-block');
  if(selectorBlocks[0]) selectorBlocks[0].style.display = 'none';

  // ---- Sizes ----
  var sizeGrid = document.querySelector('.size-grid-pdp');
  if(sizeGrid){
    var inStockSizes = Array.isArray(p.sizesInStock) ? p.sizesInStock : p.sizes;
    var firstAvailableIdx = p.sizes.findIndex(function(s){ return inStockSizes.indexOf(s) !== -1; });
    if(firstAvailableIdx === -1) firstAvailableIdx = 0; // everything sold out — nothing to preselect meaningfully

    sizeGrid.innerHTML = p.sizes.map(function(s, i){
      var oos = inStockSizes.indexOf(s) === -1;
      var cls = 'size-btn-pdp' + (i === firstAvailableIdx && !oos ? ' selected' : '') + (oos ? ' oos' : '');
      return '<button class="'+cls+'"'+(oos ? ' disabled title="Out of stock"' : '')+'>'+s+'</button>';
    }).join('');
    var newBtns = sizeGrid.querySelectorAll('.size-btn-pdp:not(.oos)');
    var realSelectedSize = inStockSizes.length ? ('UK ' + p.sizes[firstAvailableIdx]) : null;
    newBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        sizeGrid.querySelectorAll('.size-btn-pdp').forEach(function(b){ b.classList.remove('selected'); });
        btn.classList.add('selected');
        realSelectedSize = 'UK ' + btn.textContent.trim();
        var se = document.getElementById('sizeError');
        if(se) se.style.display = 'none';
        var ss = document.getElementById('stickySize');
        if(ss) ss.textContent = p.name + ' · ' + realSelectedSize;
      });
    });

    // ---- Fully sold out: disable purchase entirely instead of letting
    // someone add a phantom size to cart ----
    if(!inStockSizes.length){
      var addBtn = document.querySelector('.btn-add-cart');
      var buyBtn = document.querySelector('.btn-buy-now');
      [addBtn, buyBtn].forEach(function(b){
        if(!b) return;
        b.disabled = true;
        b.textContent = 'Out of stock';
        b.style.opacity = '0.5';
        b.style.cursor = 'not-allowed';
      });
    }

    // ---- Override add to cart / buy now / wishlist for this real product ----
    function realAddToCart(){
      var qtyEl = document.getElementById('qty');
      var qty = parseInt(qtyEl ? qtyEl.textContent : '1') || 1;
      ELEVEN.addToCart({ sku: p.sku, name: p.name, size: realSelectedSize, color: p.colorway, price: p.price, shape: 0, image: p.images[0] });
      if(qty > 1){
        var cart = ELEVEN.getCart();
        var idx = cart.findIndex(function(i){ return i.sku === p.sku && i.size === realSelectedSize; });
        if(idx >= 0){ cart[idx].qty = qty; ELEVEN.saveCart(cart); }
      }
      ELEVEN.showToast(p.name + ' added to cart');
      ELEVEN.updateAllBadges();
    }
    var addBtn = document.querySelector('.btn-add-cart');
    var buyBtn = document.querySelector('.btn-buy-now');
    var stickyAddBtn = document.querySelector('.sticky-bar .btn-add-cart');
    if(addBtn) addBtn.onclick = realAddToCart;
    if(stickyAddBtn) stickyAddBtn.onclick = realAddToCart;
    if(buyBtn) buyBtn.onclick = function(){ realAddToCart(); window.location.href = 'checkout.html'; };

    // ---- Wishlist override ----
    var wishBtn = document.querySelector('.icon-row button');
    function updateRealWishBtn(){
      var inWish = ELEVEN.isWished(p.sku);
      wishBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="'+(inWish?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" style="color:'+(inWish?'var(--gold)':'currentColor')+'"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + (inWish ? 'Saved' : 'Wishlist');
    }
    if(wishBtn){
      var freshWishBtn = wishBtn.cloneNode(true);
      wishBtn.replaceWith(freshWishBtn);
      wishBtn = freshWishBtn;
      wishBtn.addEventListener('click', function(){
        ELEVEN.toggleWish(p.sku);
        updateRealWishBtn();
        ELEVEN.showToast(ELEVEN.isWished(p.sku) ? 'Added to wishlist' : 'Removed from wishlist');
      });
      updateRealWishBtn();
    }

    // ---- Sticky bar product name/photo ----
    var stickyBarLeft = document.querySelector('.sticky-bar-left');
    if(stickyBarLeft){
      stickyBarLeft.innerHTML = '<img src="'+p.images[0]+'" style="width:34px;height:34px;object-fit:cover;border-radius:4px;">'
        + '<div><h6>'+p.name+'</h6><span class="mono" id="stickySize">'+p.name+' · UK '+p.sizes[0]+'</span></div>';
    }
  }

  // ---- Description accordion ----
  var descBody = document.querySelector('.accordion-item .accordion-body');
  if(descBody) descBody.textContent = p.desc;
  var materialBody = document.querySelectorAll('.accordion-item .accordion-body')[1];
  if(materialBody) materialBody.textContent = 'Authentic ' + p.brand + ' product. ' + p.colorway + ' colorway. Comes with original box and accessories where available.';

  // ---- Related products: show other real products ----
  function buildRealCard(prod){
    var div = document.createElement('div');
    div.className = 'product-card';
    div.style.cursor = 'pointer';
    div.onclick = function(){ window.location.href = 'product.html?sku=' + prod.sku; };
    div.innerHTML = '<div class="card-art" style="overflow:hidden;"><img src="'+prod.images[0]+'" style="width:100%;height:100%;object-fit:cover;"></div>'
      + '<div class="card-body"><span class="mono">ELV-'+prod.sku+'</span><h4>'+prod.name+'</h4><span class="card-price">'+elevenFmtPrice(prod.price)+'</span></div>';
    return div;
  }
  var relatedGrid = document.getElementById('relatedGrid');
  var recentGrid = document.getElementById('recentGrid');
  if(relatedGrid){
    relatedGrid.innerHTML = '';
    REAL_CATALOG.filter(function(x){ return x.sku !== p.sku; }).slice(0,4).forEach(function(prod){ relatedGrid.appendChild(buildRealCard(prod)); });
  }
  if(recentGrid){
    recentGrid.innerHTML = '';
    REAL_CATALOG.filter(function(x){ return x.sku !== p.sku; }).slice(4,8).forEach(function(prod){ recentGrid.appendChild(buildRealCard(prod)); });
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
