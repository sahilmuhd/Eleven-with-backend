/* ===== ELEVEN — account page ===== */

const ACCOUNT_STATUS_LABELS = {
  placed: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtDate(iso){
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch(e){ return iso; }
}

function doLogout(){
  ELEVEN_AUTH.logout();
  window.location.href = 'index.html';
}

function renderOrders(orders){
  const list = document.getElementById('ordersList');
  if(!orders.length){
    list.innerHTML = '<p style="color:var(--steel-dim); font-size:13px;">No orders yet — once you check out while logged in, they\'ll show up here.</p>';
    return;
  }
  list.innerHTML = orders.map(function(o){
    const statusLabel = ACCOUNT_STATUS_LABELS[o.status] || o.status;
    const itemsSummary = o.items.map(it => it.name + ' (' + it.size + ') ×' + it.qty).join(', ');
    return '<div style="border:1px solid var(--line); padding:16px 20px; margin-bottom:12px;">'
      + '<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">'
      + '<span class="mono" style="font-weight:600;">' + esc(o.order_id) + '</span>'
      + '<span style="font-size:12px; color:var(--gold);">' + esc(statusLabel) + '</span>'
      + '</div>'
      + '<div style="font-size:13px; color:var(--steel-dim); margin-bottom:6px;">' + esc(itemsSummary) + '</div>'
      + '<div style="display:flex; justify-content:space-between; font-size:12px; color:var(--steel-dim);">'
      + '<span>' + fmtDate(o.created_at) + '</span>'
      + '<span class="mono">&#x20B9;' + Number(o.total).toLocaleString('en-IN') + '</span>'
      + '</div>'
      + '</div>';
  }).join('');
}

(async function(){
  if(!ELEVEN_AUTH.isLoggedIn()){
    window.location.href = 'login.html?next=account.html';
    return;
  }

  const user = await ELEVEN_AUTH.refresh() || ELEVEN_AUTH.getUser();
  if(!user){
    window.location.href = 'login.html?next=account.html';
    return;
  }

  document.getElementById('welcomeHeadline').textContent = 'Welcome back, ' + (user.name ? user.name.split(' ')[0] : '') + '.';
  document.getElementById('acctName').textContent = user.name || '—';
  document.getElementById('acctEmail').textContent = user.email || '—';
  document.getElementById('acctPhone').textContent = user.phone || '—';

  const orders = await ELEVEN_AUTH.getMyOrders();
  renderOrders(orders);
})();

(function(){
  var nav = document.querySelector('nav');
  if(!nav) return;
  function checkScroll(){ nav.classList.toggle('nav-scrolled', window.scrollY > 50); }
  window.addEventListener('scroll', checkScroll, {passive:true});
  checkScroll();
})();
