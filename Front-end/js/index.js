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

(function(){
  // Make sure no leftover 'dragging' state (and its pointer-events:none) lingers.
  document.querySelectorAll('.rail-scroll').forEach(function(rail){
    rail.classList.remove('dragging');
    rail.style.cursor = '';
  });
})();

/* ---- next inline block ---- */

/* ========== ELEVEN — all enhancement effects ========== */

/* 1. HERO LETTER SPLIT */
(function(){
  function splitEl(el, baseDelay){
    var text = el.textContent;
    el.innerHTML = Array.from(text).map(function(c, i){
      var delay = baseDelay + i * 45;
      return '<span class="char-span" style="animation-delay:' + delay + 'ms">'
        + (c === ' ' ? '&nbsp;' : c) + '</span>';
    }).join('');
  }
  var top = document.querySelector('.stride-top');
  var bot = document.querySelector('.stride-bottom');
  if(top) splitEl(top, 100);
  if(bot) splitEl(bot, 320);
})();

/* 2. NAV LOGO SCRAMBLE on page load */
(function(){
  var logo = document.querySelector('.nav-logo');
  if(!logo) return;
  var final = logo.textContent.trim();
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var frame = 0, frames = 26;
  var iv = setInterval(function(){
    logo.textContent = Array.from(final).map(function(c, i){
      return frame / frames > i / final.length
        ? c
        : chars[Math.floor(Math.random() * 26)];
    }).join('');
    if(++frame > frames) clearInterval(iv);
  }, 32);
})();

/* 3. MAGNETIC BUTTONS */
(function(){
  if(window.matchMedia('(hover:none)').matches) return; // skip touch devices
  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width  / 2) * 0.22;
      var y = (e.clientY - r.top  - r.height / 2) * 0.28;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('mouseleave', function(){
      btn.style.transform = '';
    });
  });
})();

/* 4. 3D CARD TILT */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  document.querySelectorAll('.product-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width  - 0.5;
      var y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = 'perspective(700px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 7) + 'deg) translateZ(4px)';
    });
    card.addEventListener('mouseleave', function(){
      card.style.transform = '';
    });
  });
})();

/* 5. PARALLAX — hero grid lines + sneaker */
(function(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var gridLine = document.querySelector('.hero-grid-line');
  var sneaker  = document.querySelector('.hero-sneaker');
  var hero     = document.querySelector('.hero');
  if(!gridLine || !sneaker || !hero) return;
  var ticking = false;
  window.addEventListener('scroll', function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var y = window.scrollY;
      var heroH = hero.offsetHeight;
      if(y > heroH * 1.2){ ticking = false; return; }
      gridLine.style.transform = 'translateY(' + (y * 0.28) + 'px)';
      sneaker.style.transform  = 'translateY(calc(-46% + ' + (y * -0.14) + 'px)) rotate(-8deg)';
      ticking = false;
    });
  }, {passive:true});
})();

/* 6. SMOOTH ANCHOR SCROLL with nav offset */
(function(){
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(a.getAttribute('href'));
      if(!target) return;
      e.preventDefault();
      var navH = (document.querySelector('nav') || {offsetHeight:72}).offsetHeight;
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({top: top, behavior: 'smooth'});
    });
  });
})();

/* ---- next inline block ---- */

function submitNotify(){
  var input = document.getElementById('notifyEmail');
  var val = input.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){
    input.style.borderColor = '#e05252';
    input.focus();
    setTimeout(function(){ input.style.borderColor = 'rgba(247,245,240,0.2)'; }, 1800);
    return;
  }
  // Store locally
  var list = JSON.parse(localStorage.getItem('eleven_notify') || '[]');
  if(!list.includes(val)) { list.push(val); localStorage.setItem('eleven_notify', JSON.stringify(list)); }
  // Notify via WhatsApp
  var waMsg = encodeURIComponent('Hi ELEVEN! Please add me to the N°11 Archive Pack drop alert. My email: ' + val);
  window.open('https://wa.me/917560943996?text=' + waMsg, '_blank');
  // Automatically email the admin — no action needed from the customer
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      access_key: '93fa3bea-ce22-49cf-bcb0-378522dd162d',
      subject: 'N°11 Archive Pack — drop alert signup',
      from_name: 'ELEVEN website',
      email: val,
      message: 'New drop alert signup for the N°11 Archive Pack.\n\nCustomer email: ' + val
    })
  }).catch(function(err){ console.error('Notify email failed:', err); });
  document.getElementById('notifyForm').style.display = 'none';
  document.getElementById('notifySuccess').style.display = 'block';
}

/* ---- next inline block ---- */

/* LIVE COUNTDOWN — N°11 Archive Pack drop */
(function(){
  // Drop date: July 15 2026 at 10:00 AM IST (UTC+5:30)
  var DROP = new Date('2026-07-15T10:00:00+05:30').getTime();
  var days  = document.getElementById('cd-days');
  var hours = document.getElementById('cd-hours');
  var mins  = document.getElementById('cd-mins');
  var secs  = document.getElementById('cd-secs');
  if(!days) return;
  function pad(n){ return n < 10 ? '0'+n : ''+n; }
  function tick(){
    var diff = DROP - Date.now();
    if(diff <= 0){
      days.textContent = hours.textContent = mins.textContent = secs.textContent = '00';
      return;
    }
    days.textContent  = pad(Math.floor(diff / 86400000));
    hours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    mins.textContent  = pad(Math.floor((diff % 3600000)  / 60000));
    secs.textContent  = pad(Math.floor((diff % 60000)    / 1000));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ---- next inline block ---- */

/* ===== RENDER AUTHENTIC DROPS RAIL ===== */
function elevenEscAttr(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function elevenEscJs(s){
  // Safe to embed inside a single-quoted JS string that itself sits inside
  // a double-quoted HTML attribute (e.g. onclick="...'...'...").
  return String(s == null ? '' : s)
    .replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
(async function(){
  var rail = document.getElementById('realRail');
  if(!rail) return;
  var REAL_CATALOG = await fetchElevenCatalogAsync();
  if(!REAL_CATALOG.length) return;
  rail.innerHTML = REAL_CATALOG.map(function(p){
    return '<div class="product-card" style="cursor:pointer;" onclick="window.location.href=\'product.html?sku='+p.sku+'\'">'
      + '<div class="card-art">'
      + (p.isNew ? '<span class="badge">New</span>' : (p.onSale ? '<span class="badge" style="background:var(--blue);">Sale</span>' : ''))
      + '<img src="'+elevenEscAttr(p.images[0])+'" alt="'+elevenEscAttr(p.name)+'" loading="lazy">'
      + '</div>'
      + '<div class="card-body">'
      + '<div class="brand-tag">'+elevenEscAttr(p.brand)+'</div>'
      + '<h4>'+elevenEscAttr(p.name)+'</h4>'
      + '<div class="card-price-row"><span class="card-price">'+elevenFmtPrice(p.price)+'</span></div>'
      + '</div></div>';
  }).join('');
})();

/* ---- next inline block ---- */

/* ===== RENDER NEW ARRIVALS RAIL ===== */
(async function(){
  var rail = document.getElementById('newArrivalsRail');
  if(!rail) return;
  var REAL_CATALOG = await fetchElevenCatalogAsync();
  if(!REAL_CATALOG.length) return;
  var newOnes = REAL_CATALOG.filter(function(p){ return p.isNew; });
  if(!newOnes.length) newOnes = REAL_CATALOG.slice(0,4); // fallback if nothing is marked new yet
  rail.innerHTML = newOnes.map(function(p){
    return '<div class="product-card" style="cursor:pointer;" onclick="window.location.href=\'product.html?sku='+p.sku+'\'">'
      + '<div class="card-art">'
      + (p.onSale ? '<span class="badge" style="background:var(--blue);">Sale</span>' : '<span class="badge">New</span>')
      + '<img src="'+elevenEscAttr(p.images[0])+'" alt="'+elevenEscAttr(p.name)+'" loading="lazy">'
      + '</div>'
      + '<div class="card-body">'
      + '<div class="brand-tag">'+elevenEscAttr(p.brand)+'</div>'
      + '<h4>'+elevenEscAttr(p.name)+'</h4>'
      + '<div class="card-sizes">'+(p.sizes||[]).map(function(s){return '<span class="size-pip">UK '+s+'</span>';}).join('')+'</div>'
      + '<div class="card-price-row"><span class="card-price">'+elevenFmtPrice(p.price)+'</span>'
      + '<button class="btn" style="padding:8px 16px; font-size:11px;" onclick="event.stopPropagation(); ELEVEN.addToCart({sku:\''+elevenEscJs(p.sku)+'\',name:\''+elevenEscJs(p.name)+'\',size:\'UK '+((p.sizes&&p.sizes[0])||8)+'\',color:\''+elevenEscJs(p.colorway||'Charcoal')+'\',price:'+p.price+',shape:0,image:\''+elevenEscJs(p.images[0])+'\'}); ELEVEN.showToast(\''+elevenEscJs(p.name)+' added\');">Add</button>'
      + '</div></div></div>';
  }).join('');
})();

/* ---- next inline block ---- */

/* ===== RAIL SLIDER ARROWS ===== */
(function(){
  document.querySelectorAll('.rail-wrap').forEach(function(wrap){
    var railId = null;
    var leftBtn = wrap.querySelector('.rail-arrow.left');
    var rightBtn = wrap.querySelector('.rail-arrow.right');
    if(!leftBtn || !rightBtn) return;
    railId = leftBtn.getAttribute('data-rail');
    var rail = document.getElementById(railId);
    if(!rail) return;

    function cardStep(){
      var card = rail.querySelector('.product-card');
      var gap = 24;
      return card ? card.getBoundingClientRect().width + gap : 320;
    }

    function updateArrows(){
      var maxScroll = rail.scrollWidth - rail.clientWidth - 4;
      leftBtn.classList.toggle('is-hidden', rail.scrollLeft <= 4);
      rightBtn.classList.toggle('is-hidden', rail.scrollLeft >= maxScroll);
    }

    leftBtn.addEventListener('click', function(){
      rail.scrollBy({ left: -cardStep(), behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', function(){
      rail.scrollBy({ left: cardStep(), behavior: 'smooth' });
    });
    rail.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    // Re-check once content is rendered (rails fill in async)
    setTimeout(updateArrows, 300);
    setTimeout(updateArrows, 1000);
  });
})();
