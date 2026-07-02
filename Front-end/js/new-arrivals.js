const shoeShapes = [
  '<path d="M20 130 C20 112 50 100 100 95 C150 90 200 72 240 55 C265 45 280 42 285 50 C290 60 280 80 255 95 C200 118 120 132 60 134 C40 134 20 134 20 130 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>',
  '<rect x="50" y="80" width="200" height="55" rx="22" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/><rect x="65" y="60" width="170" height="35" rx="16" fill="#1f1f21" stroke="#4a4a4d" stroke-width="1.2"/>',
  '<path d="M30 120 C30 100 70 88 130 84 C190 80 240 65 270 48" fill="none" stroke="#4a4a4d" stroke-width="3"/><ellipse cx="150" cy="128" rx="120" ry="12" fill="#2a2a2c"/>',
  '<path d="M70 110 Q150 60 230 110 L215 145 Q150 108 85 145 Z" fill="#2a2a2c" stroke="#4a4a4d" stroke-width="1.5"/>'
];

function renderCard(p, container) {
  const badgeLabel = p.onSale ? '-' + Math.round((1 - p.price/p.strike)*100) + '%' : (p.isNew ? 'New' : '');
  const badgeClass = p.onSale ? 'badge-sale' : 'badge-new';
  const wasHtml = (p.onSale && p.strike) ? `<span class="was">${ELEVEN.fmt(p.strike)}</span>` : '';
  const img = (p.images && p.images[0]) || '';
  const div = document.createElement('div');
  div.className = 'product-card';
  div.onclick = () => window.location.href = 'product.html?sku=' + encodeURIComponent(p.sku);
  div.innerHTML = `
    <div class="card-art" style="overflow:hidden;">
      ${badgeLabel ? `<span class="badge-pill ${badgeClass}">${badgeLabel}</span>` : ''}
      ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;">` : `<svg viewBox="0 0 300 180">${shoeShapes[0]}</svg>`}
    </div>
    <div class="card-body">
      <span class="mono">ELV-${p.sku}</span>
      <h4>${p.name}</h4>
      <div class="card-sizes">${(p.sizes||[]).map(s=>`<span class="size-pip">UK ${s}</span>`).join('')}</div>
      <div class="card-price-row">
        <span class="card-price">${wasHtml}${ELEVEN.fmt(p.price)}</span>
        <button class="btn" style="padding:8px 16px;font-size:11px;" onclick="event.stopPropagation();ELEVEN.addToCart({sku:'${p.sku}',name:'${p.name}',size:'UK ${(p.sizes&&p.sizes[0])||8}',color:'${p.colorway||'Charcoal'}',price:${p.price},shape:0,image:'${img}'});ELEVEN.showToast('${p.name} added');">Add</button>
      </div>
    </div>`;
  container.appendChild(div);
}

document.addEventListener('DOMContentLoaded', async () => {
  const newGrid = document.getElementById('newGrid');
  const saleGrid = document.getElementById('saleGrid');
  const catalog = await fetchElevenCatalogAsync();
  const newProducts = catalog.filter(p => p.isNew);
  const saleProducts = catalog.filter(p => p.onSale);
  newProducts.forEach(p => renderCard(p, newGrid));
  saleProducts.forEach(p => renderCard(p, saleGrid));
});

// Countdown — Drop date: July 15 2026 at 10:00 AM IST (UTC+5:30), matches homepage
(function(){
  const target = new Date('2026-07-15T10:00:00+05:30').getTime();
  function tick(){
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    const pad = n => String(n).padStart(2,'0');
    document.getElementById('cd-d').textContent = pad(d);
    document.getElementById('cd-h').textContent = pad(h);
    document.getElementById('cd-m').textContent = pad(m);
    document.getElementById('cd-s').textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);
})();

function submitNotify() {
  const inp = document.getElementById('notifyEmail');
  if (!inp.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) {
    inp.style.borderColor = '#e05252';
    return;
  }
  inp.style.borderColor = '';
  ELEVEN.showToast("You're on the list — we'll drop you a note.");
  inp.value = '';
}

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
