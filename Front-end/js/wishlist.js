/* ===== Product catalog — kept in sync with shop.html ===== */
const shoeShapes = [
  '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
  '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
  '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
  '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
];

const allProducts = [
  { name:'Stride Runner',  sku:'RN-001', price:6499,  shape:0, sizes:[7,8,9,10], isNew:true,  onSale:false },
  { name:'Off-Court Low',  sku:'CS-014', price:4999,  shape:1, sizes:[6,7,9],     isNew:false, onSale:true  },
  { name:'Velocity Mid',   sku:'RN-007', price:5299,  shape:2, sizes:[8,9,10,11],isNew:false, onSale:true  },
  { name:'Drift Slide',    sku:'SL-002', price:2199,  shape:3, sizes:[7,8,9],     isNew:false, onSale:false },
  { name:'Apex Trainer',   sku:'RN-012', price:7299,  shape:0, sizes:[8,9,10],    isNew:true,  onSale:false },
  { name:'Sector One',     sku:'CS-009', price:4599,  shape:1, sizes:[6,7,8],     isNew:false, onSale:false },
  { name:'Glide Pro',      sku:'RN-018', price:6899,  shape:2, sizes:[7,8,9,10],  isNew:false, onSale:false },
  { name:'Form Low',       sku:'CS-021', price:5099,  shape:1, sizes:[8,9,10],    isNew:false, onSale:true  },
  { name:'Edge Runner',    sku:'RN-005', price:6299,  shape:0, sizes:[6,7,8,9],   isNew:true,  onSale:false },
  { name:'Loop Mid',       sku:'CS-017', price:4799,  shape:1, sizes:[9,10,11],   isNew:false, onSale:false },
  { name:'Vault Slide',    sku:'SL-008', price:2499,  shape:3, sizes:[6,7,8],     isNew:false, onSale:false },
  { name:'Stratus Trainer',sku:'RN-023', price:7499,  shape:2, sizes:[8,9,10,11],isNew:true,  onSale:false },
];

async function renderWishlist(){
  const wishedSkus = ELEVEN.getWishlist();
  const catalog = await fetchElevenCatalogAsync();
  const realItems = catalog
    .filter(p => wishedSkus.includes(p.sku))
    .map(p => ({ ...p, real: true, image: p.images[0] }));
  const fakeItems = allProducts.filter(p => wishedSkus.includes(p.sku));
  const items = [...realItems, ...fakeItems];
  const grid = document.getElementById('wishGrid');
  const empty = document.getElementById('emptyWish');
  const actions = document.getElementById('wishActions');

  if(items.length === 0){
    grid.innerHTML = '';
    grid.style.display = 'none';
    empty.style.display = 'flex';
    actions.style.display = 'none';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';
  actions.style.display = 'flex';
  document.getElementById('wishCount').textContent = items.length + (items.length === 1 ? ' item' : ' items');

  grid.innerHTML = items.map(p => {
    const salePrice = p.onSale ? Math.round(p.price * 0.85) : p.price;
    const detailUrl = p.real ? `product.html?sku=${p.sku}` : 'product.html';
    const artInner = p.real
      ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" alt="${p.name}">`
      : `<svg viewBox="0 0 300 180">${shoeShapes[p.shape]}</svg>`;
    return `
    <div class="product-card" onclick="window.location.href='${detailUrl}'">
      <div class="card-art" style="overflow:hidden;">
        ${p.isNew ? '<span class="badge">New</span>' : p.onSale ? '<span class="badge sale">-15%</span>' : ''}
        <button class="card-remove" aria-label="Remove from wishlist" onclick="event.stopPropagation(); removeFromWishlist('${p.sku}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ${artInner}
      </div>
      <div class="card-body">
        <span class="mono">ELV-${p.sku}</span>
        <h4>${p.name}</h4>
        <div class="card-sizes">${p.sizes.map(s=>`<span class="size-pip">UK ${s}</span>`).join('')}</div>
        <div class="card-price-row">
          <span class="card-price">${p.onSale ? `<span class="strike">₹${p.price.toLocaleString('en-IN')}</span>` : ''}₹${salePrice.toLocaleString('en-IN')}</span>
          <button class="quick-add" onclick="event.stopPropagation(); addToCartFromWish(${JSON.stringify(p).replace(/"/g,'&quot;')})">Add</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function removeFromWishlist(sku){
  ELEVEN.toggleWish(sku);
  ELEVEN.showToast('Removed from wishlist');
  renderWishlist();
}
function clearWishlist(){
  ELEVEN.saveWishlist([]);
  renderWishlist();
}
function addToCartFromWish(p){
  ELEVEN.addToCart({ sku: p.sku, name: p.name, size: 'UK ' + p.sizes[0], color: 'Charcoal', price: p.onSale ? Math.round(p.price*0.85) : p.price, shape: p.shape });
  ELEVEN.showToast(p.name + ' added to cart');
}

document.addEventListener('eleven:synced', renderWishlist);
renderWishlist();

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
