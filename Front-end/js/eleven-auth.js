/* ===== ELEVEN — customer accounts =====
   Talks to /api/auth/register/, /api/auth/login/, /api/auth/me/ and
   /api/my-orders/. Stores the auth token in localStorage so the customer
   stays logged in across page loads and tabs. */

const ELEVEN_AUTH = {
  TOKEN_KEY: 'eleven_auth_token',
  USER_KEY: 'eleven_auth_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  _save(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  async register({ name, email, phone, password }) {
    const res = await fetch(ELEVEN_API_BASE + '/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(firstError(data) || 'Could not create account.');
    this._save(data.token, { name: data.name, email: data.email, phone: data.phone });
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(ELEVEN_API_BASE + '/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(firstError(data) || 'Incorrect email or password.');
    this._save(data.token, { name: data.name, email: data.email, phone: data.phone });
    return data;
  },

  /* Confirms a saved token is still valid, and refreshes the cached user
     info. Call this on pages that show account state (nav, account page). */
  async refresh() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(ELEVEN_API_BASE + '/auth/me/', {
        headers: { 'Authorization': 'Token ' + token },
      });
      if (!res.ok) { this.logout(); return null; }
      const data = await res.json();
      localStorage.setItem(this.USER_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      // Network hiccup — keep the cached user rather than logging them out.
      return this.getUser();
    }
  },

  async getMyOrders() {
    const token = this.getToken();
    if (!token) return [];
    const res = await fetch(ELEVEN_API_BASE + '/my-orders/', {
      headers: { 'Authorization': 'Token ' + token },
    });
    if (!res.ok) return [];
    return await res.json();
  },
};

function firstError(data) {
  if (!data) return null;
  if (typeof data.detail === 'string') return data.detail;
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (Array.isArray(val) && val.length) return val[0];
    if (typeof val === 'string') return val;
  }
  return null;
}

/* Updates any nav "Account" link on the page to reflect login state.
   - Elements with [data-account-link] get their href updated (login.html vs account.html)
   - Elements with [data-account-label] get their text updated ("Account" vs "Hi, Name")
   A single element can have both attributes (e.g. the plain-text mobile menu link). */
function eleven_updateAccountNav() {
  const user = ELEVEN_AUTH.getUser();
  const label = user ? 'Hi, ' + user.name.split(' ')[0] : 'Account';
  const href = user ? 'account.html' : 'login.html';
  document.querySelectorAll('[data-account-link]').forEach(el => {
    el.setAttribute('href', href);
  });
  document.querySelectorAll('[data-account-label]').forEach(el => {
    el.textContent = label;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  eleven_updateAccountNav();
  ELEVEN_AUTH.refresh().then(eleven_updateAccountNav);
});
