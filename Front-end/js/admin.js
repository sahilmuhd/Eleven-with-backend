/* ============ SIMPLE PASSCODE GATE (not real security — just keeps casual visitors out) ============ */
  const ADMIN_PASSCODE = 'eleven-admin';

  function tryUnlock(){
    const val = document.getElementById('gateInput').value;
    if(val === ADMIN_PASSCODE){
      sessionStorage.setItem('eleven_admin_unlocked', '1');
      showAdmin();
    } else {
      document.getElementById('gateErr').style.display = 'block';
    }
  }
  document.getElementById('gateInput').addEventListener('keydown', e => { if(e.key === 'Enter') tryUnlock(); });

  function showAdmin(){
    document.getElementById('gate').style.display = 'none';
    document.getElementById('adminMain').style.display = 'block';
    document.getElementById('logoutLink').style.display = 'inline';
    renderTable();
  }

  document.getElementById('logoutLink').addEventListener('click', function(e){
    e.preventDefault();
    sessionStorage.removeItem('eleven_admin_unlocked');
    location.reload();
  });

  if(sessionStorage.getItem('eleven_admin_unlocked') === '1') showAdmin();

  /* ============ PRODUCT DATA (staged in localStorage) ============ */
  const STORAGE_KEY = 'eleven_admin_catalog';
  let editingSku = null; // tracks if form is editing an existing product

  function loadCatalog(){
    const staged = localStorage.getItem(STORAGE_KEY);
    if(staged){
      try { return JSON.parse(staged); } catch(e){ /* fall through */ }
    }
    // first run: seed from the live catalog file
    return JSON.parse(JSON.stringify(typeof ELEVEN_REAL_PRODUCTS !== 'undefined' ? ELEVEN_REAL_PRODUCTS : []));
  }

  function saveCatalog(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ============ RENDER TABLE ============ */
  function renderTable(){
    const catalog = loadCatalog();
    const rows = document.getElementById('productRows');
    document.getElementById('countSub').textContent = catalog.length + ' product' + (catalog.length===1?'':'s') + ' staged in this browser';

    if(catalog.length === 0){
      rows.innerHTML = '<tr class="empty-row"><td colspan="6">No products yet — add your first one above.</td></tr>';
      return;
    }

    rows.innerHTML = catalog.map(p => {
      const img = (p.images && p.images[0]) ? p.images[0] : '';
      const badges = [];
      if(p.isNew) badges.push('<span class="badge new">New</span>');
      if(p.strike && p.strike > p.price) badges.push('<span class="badge sale">Sale</span>');
      if(p.inStock === false) badges.push('<span class="badge oos">Out of stock</span>');
      return `
        <tr>
          <td>${img ? `<img class="thumb" src="${escapeHtml(img)}" onerror="this.style.opacity=0.2">` : `<div class="thumb"></div>`}</td>
          <td>
            <div class="prod-name">${escapeHtml(p.name || '(unnamed)')}</div>
            <div class="prod-meta mono">${escapeHtml(p.sku || '')} · ${escapeHtml(p.brand || '')}</div>
          </td>
          <td class="mono">₹${Number(p.price||0).toLocaleString('en-IN')}</td>
          <td class="mono">${(p.sizes||[]).join(', ')}</td>
          <td>${badges.join(' ') || '<span class="prod-meta">—</span>'}</td>
          <td>
            <div class="row-actions">
              <button onclick="editProduct('${escapeAttr(p.sku)}')">Edit</button>
              <button class="btn-danger" onclick="deleteProduct('${escapeAttr(p.sku)}')">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return String(s).replace(/'/g, "\\'"); }

  /* ============ FORM HANDLING ============ */
  function resetForm(){
    editingSku = null;
    ['f_name','f_brand','f_sku','f_colorway','f_price','f_strike','f_cats','f_sizes','f_images','f_desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f_gender').value = 'Unisex';
    document.getElementById('f_isNew').checked = false;
    document.getElementById('f_inStock').checked = true;
    document.getElementById('formTitle').textContent = 'Add a product';
    document.getElementById('formSub').textContent = 'Fill in the details below, then save.';
    document.getElementById('cancelEditBtn').style.display = 'none';
  }

  function editProduct(sku){
    const catalog = loadCatalog();
    const p = catalog.find(x => x.sku === sku);
    if(!p) return;
    editingSku = sku;
    document.getElementById('f_name').value = p.name || '';
    document.getElementById('f_brand').value = p.brand || '';
    document.getElementById('f_sku').value = p.sku || '';
    document.getElementById('f_colorway').value = p.colorway || '';
    document.getElementById('f_price').value = p.price || '';
    document.getElementById('f_strike').value = p.strike || '';
    document.getElementById('f_cats').value = (p.cats||[]).join(', ');
    document.getElementById('f_gender').value = (p.gender||[]).join(', ');
    document.getElementById('f_sizes').value = (p.sizes||[]).join(', ');
    document.getElementById('f_images').value = (p.images||[]).join('\n');
    document.getElementById('f_desc').value = p.desc || '';
    document.getElementById('f_isNew').checked = !!p.isNew;
    document.getElementById('f_inStock').checked = p.inStock !== false;
    document.getElementById('formTitle').textContent = 'Edit product';
    document.getElementById('formSub').textContent = 'Editing ' + p.name;
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function deleteProduct(sku){
    if(!confirm('Remove this product from the catalog?')) return;
    let catalog = loadCatalog();
    catalog = catalog.filter(p => p.sku !== sku);
    saveCatalog(catalog);
    renderTable();
    showToast('Product removed');
  }

  function saveProduct(){
    const name = document.getElementById('f_name').value.trim();
    const sku = document.getElementById('f_sku').value.trim();
    const price = Number(document.getElementById('f_price').value);

    if(!name || !sku || !price){
      showToast('Name, SKU, and price are required');
      return;
    }

    const images = document.getElementById('f_images').value.split('\n').map(s => s.trim()).filter(Boolean);
    const sizes = document.getElementById('f_sizes').value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    const cats = document.getElementById('f_cats').value.split(',').map(s => s.trim()).filter(Boolean);
    const gender = document.getElementById('f_gender').value.split(',').map(s => s.trim()).filter(Boolean);
    const strike = Number(document.getElementById('f_strike').value) || 0;

    const product = {
      sku,
      name,
      brand: document.getElementById('f_brand').value.trim(),
      price,
      strike,
      cats: cats.length ? cats : ['Lifestyle'],
      gender: gender.length ? gender : ['Unisex'],
      sizes: sizes.length ? sizes : [7,8,9,10],
      isNew: document.getElementById('f_isNew').checked,
      onSale: strike > price,
      inStock: document.getElementById('f_inStock').checked,
      images: images.length ? images : ['images/products/placeholder.jpeg'],
      colorway: document.getElementById('f_colorway').value.trim(),
      desc: document.getElementById('f_desc').value.trim()
    };

    let catalog = loadCatalog();
    const existingIdx = catalog.findIndex(p => p.sku === (editingSku || sku));

    if(editingSku && editingSku !== sku){
      // sku changed during edit — remove old entry
      catalog = catalog.filter(p => p.sku !== editingSku);
    }

    const dupIdx = catalog.findIndex(p => p.sku === sku);
    if(dupIdx > -1){
      catalog[dupIdx] = product;
    } else {
      catalog.push(product);
    }

    saveCatalog(catalog);
    renderTable();
    showToast(editingSku ? 'Product updated' : 'Product added');
    resetForm();
  }

  /* ============ EXPORT ============ */
  function buildFileContents(){
    const catalog = loadCatalog();
    const body = catalog.map(p => {
      return `  {
    sku: ${JSON.stringify(p.sku)},
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(p.brand)},
    price: ${Number(p.price)||0},
    strike: ${Number(p.strike)||0},
    cats: ${JSON.stringify(p.cats)},
    gender: ${JSON.stringify(p.gender)},
    sizes: ${JSON.stringify(p.sizes)},
    isNew: ${!!p.isNew},
    onSale: ${!!p.onSale},
    inStock: ${p.inStock !== false},
    images: ${JSON.stringify(p.images)},
    colorway: ${JSON.stringify(p.colorway)},
    desc: ${JSON.stringify(p.desc)}
  }`;
    }).join(',\n');

    return `/* ===== ELEVEN — real/authentic product catalog ===== */
/* Generated from the admin page on ${new Date().toISOString().slice(0,10)}. */

const ELEVEN_REAL_PRODUCTS = [
${body}
];

function elevenFmtPrice(n){ return '₹' + Math.round(n).toLocaleString('en-IN'); }
`;
  }

  function exportCatalog(){
    const contents = buildFileContents();
    const blob = new Blob([contents], {type:'text/javascript'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eleven-real-products.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Catalog file downloaded — upload it to replace eleven-real-products.js');
  }

  function previewExport(){
    const box = document.getElementById('exportPreview');
    box.textContent = buildFileContents();
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }

  function resetToOriginal(){
    if(!confirm('Discard all staged changes in this browser and reload the original catalog?')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
    showToast('Reset to original catalog');
  }
