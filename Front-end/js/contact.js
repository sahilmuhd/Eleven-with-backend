let selectedTopic = '';

  function selectTopic(btn, topic) {
    document.querySelectorAll('.topic-chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTopic = topic;
    const orderField = document.getElementById('orderField');
    if(topic === 'Order issue' || topic === 'Returns') {
      orderField.classList.add('show');
    } else {
      orderField.classList.remove('show');
    }
  }

  function submitForm() {
    let valid = true;

    const name = document.getElementById('inp-name');
    if(!name.value.trim()) { name.classList.add('error'); valid = false; } else name.classList.remove('error');

    const email = document.getElementById('inp-email');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.classList.add('error'); valid = false; } else email.classList.remove('error');

    const msg = document.getElementById('inp-message');
    if(!msg.value.trim()) { msg.classList.add('error'); valid = false; } else msg.classList.remove('error');

    if(!valid) {
      const firstErr = document.querySelector('input.error, textarea.error');
      if(firstErr) firstErr.scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    // Build WhatsApp message with all form data
    const topic = selectedTopic || 'General';
    const orderId = document.getElementById('inp-orderid') ? document.getElementById('inp-orderid').value.trim() : '';
    let waText = 'Hi ELEVEN! I have a query.';
    waText += '\n\nName: ' + name.value.trim();
    waText += '\nEmail: ' + email.value.trim();
    waText += '\nTopic: ' + topic;
    if(orderId) waText += '\nOrder ID: ' + orderId;
    waText += '\n\nMessage: ' + msg.value.trim();

    // Also open mailto as fallback
    const mailSubject = encodeURIComponent('ELEVEN Enquiry — ' + topic);
    const mailBody = encodeURIComponent(waText);
    const waLink = 'https://wa.me/917560943996?text=' + encodeURIComponent(waText);

    // Open WhatsApp
    window.open(waLink, '_blank');
    var fb = document.getElementById('waFallback');
    if(fb) fb.href = waLink;

    document.getElementById('successEmail').textContent = email.value.trim();
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('successState').classList.add('show');
  }

  function resetForm() {
    document.getElementById('inp-name').value = '';
    document.getElementById('inp-email').value = '';
    document.getElementById('inp-message').value = '';
    document.getElementById('inp-orderid').value = '';
    document.querySelectorAll('.topic-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('orderField').classList.remove('show');
    selectedTopic = '';
    document.getElementById('contactForm').style.display = '';
    document.getElementById('successState').classList.remove('show');
  }

  function toggleFaq(head) {
    const item = head.parentElement;
    item.classList.toggle('open');
  }

  // Pre-select topic from URL hash
  if(window.location.hash === '#faq') {
    document.querySelector('.faq-section').scrollIntoView({ behavior:'smooth' });
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
