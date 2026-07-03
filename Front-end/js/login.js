/* ===== ELEVEN — login page ===== */

async function submitLogin(){
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('formError');
  const btn = document.getElementById('submitBtn');

  errorEl.classList.remove('show');

  if(!email || !password){
    errorEl.textContent = 'Please enter your email and password.';
    errorEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    await ELEVEN_AUTH.login({ email, password });
    const redirect = new URLSearchParams(window.location.search).get('next');
    window.location.href = redirect || 'account.html';
  } catch(err) {
    errorEl.textContent = err.message || 'Incorrect email or password.';
    errorEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
}

document.getElementById('passwordInput').addEventListener('keydown', e => { if(e.key === 'Enter') submitLogin(); });

/* If already logged in, no need to log in again */
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
