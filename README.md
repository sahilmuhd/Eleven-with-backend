<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:0d0221,50:7b2ff7,100:00f0ff&text=ELEVEN&fontColor=00f0ff&fontSize=48&fontAlignY=38&desc=Full-stack%20shoe%20store%20with%20Django%20API%20and%20React%20storefront&descAlignY=58&descSize=16&animation=fadeIn" alt="ELEVEN"/>

<img src="https://img.shields.io/badge/Django-0d0221?style=for-the-badge&logo=django&logoColor=00f0ff"/>
<img src="https://img.shields.io/badge/DRF-0d0221?style=for-the-badge&logo=django&logoColor=7b2ff7"/>
<img src="https://img.shields.io/badge/PostgreSQL-0d0221?style=for-the-badge&logo=postgresql&logoColor=ff2a6d"/>
<img src="https://img.shields.io/badge/React-0d0221?style=for-the-badge&logo=react&logoColor=00f0ff"/>
<img src="https://img.shields.io/badge/Vite-0d0221?style=for-the-badge&logo=vite&logoColor=7b2ff7"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-0d0221?style=for-the-badge&logo=tailwindcss&logoColor=ff2a6d"/>
<img src="https://img.shields.io/badge/Capacitor-0d0221?style=for-the-badge&logo=capacitor&logoColor=00f0ff"/>
<img src="https://img.shields.io/badge/Render-0d0221?style=for-the-badge&logo=render&logoColor=7b2ff7"/>

</div>

## // OVERVIEW

ELEVEN is a full-stack online shoe store. `Back-end/` is a Django + Django REST Framework API (products, orders, customers, coupons, an admin panel and a sales dashboard). `Front-end/` is a React (Vite) storefront that talks to that API, with an optional Capacitor Android wrapper.

## // FEATURES

- Product catalog served from the database, seeded from a bundled `products.json` (`python manage.py seed_products`)
- Django admin for managing products, images and orders, plus a sales dashboard at `/admin/dashboard/`
- Customer accounts, cart and wishlist synced to the server when logged in
- Coupon codes, order address and payment fields, stock tracking
- Razorpay checkout flow and Resend email notifications (configured via environment variables)
- Order tracking page, search, new arrivals, account and contact pages
- Offline fallback catalog if the API cannot be reached
- Capacitor Android project (`com.elevenbrand.app`)

## // TECH_STACK

| Layer | Tech |
|-------|------|
| Backend | Django 6, Django REST Framework, django-cors-headers, dj-database-url, WhiteNoise, Gunicorn, Pillow |
| Database | SQLite locally, PostgreSQL via `DATABASE_URL` (psycopg2) |
| Frontend | React 18, React Router 6, Vite 5, Tailwind CSS 3, vite-plugin-pwa |
| Mobile | Capacitor 8 (Android) |
| Hosting | Render |

## // GETTING_STARTED

Backend:

```bash
cd Back-end
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_products    # safe to re-run, updates existing SKUs
python manage.py runserver
```

- Admin panel: http://127.0.0.1:8000/admin/
- API root: http://127.0.0.1:8000/api/products/

Frontend:

```bash
cd Front-end
npm install
cp .env.example .env.local        # set VITE_API_BASE, e.g. http://127.0.0.1:8000/api
npm run dev
```

Production build: `npm run build` (output in `dist/`). Because the app uses React Router, configure your host to rewrite unknown paths to `index.html`.

Backend environment variables read by `settings.py`: `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SELLER_NOTIFY_EMAIL`. `Back-end/build.sh` is the Render build command (collectstatic, migrate, createsuperuser from `DJANGO_SUPERUSER_*` variables, seed products).

### API

| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/products/`, `/api/products/<sku>/` | Public catalog |
| POST | `/api/products/` | Staff only |
| POST | `/api/orders/` | Place an order |
| GET / PATCH | `/api/orders/`, `/api/orders/<id>/` | Staff only |

## // PROJECT_STRUCTURE

```
Back-end/
  eleven_backend/    # settings, urls
  shop/              # models, serializers, views, admin, dashboard, seed_data
Front-end/
  src/pages/         # one file per route
  src/context/       # AuthContext, ShopContext
  src/lib/           # api, auth, config
  android/           # Capacitor Android project
```

## // LIVE_DEMO

Frontend default URL configured in the repo: https://eleven-frontend.onrender.com (API: https://eleven-with-backend.onrender.com/api)

## // AUTHOR

**Sahil** - [github.com/sahilmuhd](https://github.com/sahilmuhd) · [sahilmuhd.com](https://sahilmuhd.com)

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=100&color=0:00f0ff,50:7b2ff7,100:0d0221&section=footer" alt="footer"/>

Built by [Sahil](https://github.com/sahilmuhd) · [sahilmuhd.com](https://sahilmuhd.com)

</div>
