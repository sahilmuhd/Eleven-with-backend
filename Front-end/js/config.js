/* ===== ELEVEN — environment config =====
   Sets window.ELEVEN_API_BASE before eleven-api.js runs.
   - On localhost/127.0.0.1 -> talks to your local Django dev server.
   - Everywhere else (Render, your real domain, etc.) -> talks to the
     live backend on Render.
   Edit ONLY the PROD_API_BASE value below when your backend URL changes. */
(function () {
  const PROD_API_BASE = 'https://eleven-with-backend.onrender.com/api';
  const LOCAL_API_BASE = 'http://127.0.0.1:8000/api';

  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  window.ELEVEN_API_BASE = isLocal ? LOCAL_API_BASE : PROD_API_BASE;
})();
