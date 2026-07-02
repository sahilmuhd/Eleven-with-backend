// Populate confirmation from saved order data
  (async function(){
    var orderId  = localStorage.getItem('eleven_order_id')    || ('ELV-' + Math.floor(10000+Math.random()*90000));
    var snapshot = JSON.parse(localStorage.getItem('eleven_order_snapshot') || 'null');
    var subtotal = Number(localStorage.getItem('eleven_order_subtotal') || 0);
    var discount = Number(localStorage.getItem('eleven_order_discount') || 0);
    var total    = Number(localStorage.getItem('eleven_order_total_raw') || 0);
    var coupon   = localStorage.getItem('eleven_order_coupon') || '';

    // Update order number display
    document.querySelectorAll('.mono, .val').forEach(function(el){
      if(el.textContent.includes('ELV-')) el.textContent = orderId;
    });

    // Render items
    var itemsEl = document.getElementById('orderItems');
    var catalog = await fetchElevenCatalogAsync();
    function imgFor(sku){ var p = catalog.find(function(x){ return x.sku === sku; }); return (p && p.images && p.images[0]) ? p.images[0] : null; }
    if(itemsEl && snapshot && snapshot.length){
      itemsEl.innerHTML = snapshot.map(function(it){
        var img = imgFor(it.sku);
        return '<div style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid var(--line);font-size:13px;">'
          + '<div class="item-art" style="overflow:hidden;">' + (img ? '<img src="'+img+'" alt="'+it.name+'" style="width:100%;height:100%;object-fit:cover;display:block;">' : '') + '</div>'
          + '<span style="flex:1;display:flex;justify-content:space-between;"><strong>'+it.name+'</strong> &middot; '+it.size+' &times;'+it.qty+'</span>'
          + '</div>';
      }).join('');
    }

    // Render totals
    var totalsEl = document.getElementById('conf-totals');
    if(totalsEl){
      var rows = '<div class="totals-row"><span>Subtotal</span><span class="mono">&#x20B9;'+Math.round(subtotal).toLocaleString('en-IN')+'</span></div>';
      if(discount > 0){
        rows += '<div class="totals-row"><span>Discount'+(coupon?' ('+coupon+')':'')+'</span><span class="mono" style="color:var(--gold);">&minus;&#x20B9;'+Math.round(discount).toLocaleString('en-IN')+'</span></div>';
      }
      rows += '<div class="totals-row"><span>Shipping</span><span class="mono">Free</span></div>';
      rows += '<div class="totals-row total"><span>Total paid</span><span class="mono">&#x20B9;'+Math.round(total).toLocaleString('en-IN')+'</span></div>';
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
