const shoeShapes = [
  '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
  '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
  '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
  '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
];

let allProducts = [];

async function initSearchCatalog(){
  const catalog = await fetchElevenCatalogAsync();
  allProducts = catalog.map(function(p){
    return { name:p.name, sku:p.sku, price:p.price, shape:0, cats:p.cats, sizes:p.sizes, isNew:p.isNew, onSale:p.onSale, real:true, image:p.images[0], brand:p.brand };
  });
  renderResults();
}

const input = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');
const grid = document.getElementById('resultsGrid');
const noResults = document.getElementById('noResults');
const promptState = document.getElementById('promptState');
const meta = document.getElementById('resultsMeta');

function matchesQuery(p, q){
  if(q === '') return true;
  const hay = `${p.name} ${p.sku} ${p.cats.join(' ')} ${p.brand||''}`.toLowerCase();
  if(q === 'sale') return p.onSale;
  return hay.includes(q.toLowerCase());
}

function renderResults(){
  const q = input.value.trim();
  clearBtn.classList.toggle('show', q.length > 0);

  const results = allProducts.filter(p => matchesQuery(p, q));

  if(q === ''){
    // Show new arrivals as a default browse state instead of an empty prompt
    promptState.style.display = 'none';
    const defaults = allProducts.filter(p => p.isNew);
    renderGrid(defaults);
    meta.textContent = 'New arrivals';
    return;
  }

  if(results.length === 0){
    grid.style.display = 'none';
    noResults.style.display = 'flex';
    meta.textContent = '';
    return;
  }

  meta.textContent = `${results.length} result${results.length === 1 ? '' : 's'} for "${q}"`;
  renderGrid(results);
}

function renderGrid(items){
  noResults.style.display = 'none';
  grid.style.display = 'grid';
  grid.innerHTML = items.map(p => {
    const inWish = ELEVEN.isWished(p.sku);
    const salePrice = p.onSale ? Math.round(p.price * 0.85) : p.price;
    const detailUrl = p.real ? `product.html?sku=${p.sku}` : 'product.html';
    const artInner = p.real
      ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" alt="${p.name}">`
      : `<svg viewBox="0 0 300 180">${shoeShapes[p.shape]}</svg>`;
    return `
    <div class="product-card" onclick="window.location.href='${detailUrl}'">
      <div class="card-art" style="overflow:hidden;">
        ${p.isNew ? '<span class="badge">New</span>' : p.onSale ? '<span class="badge sale">-15%</span>' : ''}
        <button class="card-wishlist ${inWish?'wishlisted':''}" aria-label="${inWish?'Remove from wishlist':'Add to wishlist'}" onclick="event.stopPropagation(); toggleWish('${p.sku}', this)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${inWish?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${artInner}
      </div>
      <div class="card-body">
        <span class="mono">ELV-${p.sku}</span>
        <h4>${p.name}</h4>
        <div class="card-sizes">${p.sizes.map(s=>`<span class="size-pip">UK ${s}</span>`).join('')}</div>
        <div class="card-price-row">
          <span class="card-price">${p.onSale ? `<span class="strike">₹${p.price.toLocaleString('en-IN')}</span>` : ''}₹${salePrice.toLocaleString('en-IN')}</span>
          <button class="quick-add" onclick="event.stopPropagation(); addQuick(${JSON.stringify(p).replace(/"/g,'&quot;')})">Add</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleWish(sku, btn){
  const nowInWish = ELEVEN.toggleWish(sku);
  btn.classList.toggle('wishlisted', nowInWish);
  btn.querySelector('svg').setAttribute('fill', nowInWish ? 'currentColor' : 'none');
  btn.setAttribute('aria-label', nowInWish ? 'Remove from wishlist' : 'Add to wishlist');
  ELEVEN.showToast(nowInWish ? 'Added to wishlist' : 'Removed from wishlist');
}

function addQuick(p){
  ELEVEN.addToCart({ sku: p.sku, name: p.name, size: 'UK ' + p.sizes[0], color: 'Charcoal', price: p.onSale ? Math.round(p.price*0.85) : p.price, shape: p.shape });
  ELEVEN.showToast(p.name + ' added to cart');
}

function setQuery(q){
  input.value = q;
  input.focus();
  renderResults();
}

clearBtn.addEventListener('click', () => { input.value=''; input.focus(); renderResults(); });
input.addEventListener('input', renderResults);

initSearchCatalog();

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
