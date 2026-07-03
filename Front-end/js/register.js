/* ===== ELEVEN — register page ===== */

async function submitRegister(){
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('formError');
  const btn = document.getElementById('submitBtn');

  errorEl.classList.remove('show');

  if(!name || !email || !phone || !password){
    errorEl.textContent = 'Please fill in every field.';
    errorEl.classList.add('show');
    return;
  }
  if(!/^\d{10}$/.test(phone)){
    errorEl.textContent = 'Enter a valid 10-digit phone number.';
    errorEl.classList.add('show');
    return;
  }
  if(password.length < 6){
    errorEl.textContent = 'Password must be at least 6 characters.';
    errorEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    await ELEVEN_AUTH.register({ name, email, phone, password });
    window.location.href = 'account.html';
  } catch(err) {
    errorEl.textContent = err.message || 'Could not create account. Please try again.';
    errorEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
}

document.getElementById('passwordInput').addEventListener('keydown', e => { if(e.key === 'Enter') submitRegister(); });

/* If already logged in, no need to register again */
(function(){
  if(ELEVEN_AUTH.isLoggedIn()) window.location.href = 'account.html';
})();

(function(){
  var nav = document.querySelector('nav');
  if(!nav) return;
  function checkScroll(){ nav.classList.toggle('nav-scrolled', window.scrollY > 50); }
  window.addEventListener('scroll', checkScroll, {passive:true});
  checkScroll();
})();
