# ELEVEN — React storefront

This is a React (Vite) rebuild of the ELEVEN static storefront. It talks to the
same Django REST backend the original site used — same endpoints, same auth
tokens, same order/cart/wishlist model.

## Setup

```bash
npm install
cp .env.example .env.local   # then edit VITE_API_BASE if needed
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

The build output lands in `dist/` — deploy that folder to any static host
(Vercel, Netlify, Render static site, S3, etc.). Since this is a client-side
router (React Router), configure your host to redirect all unknown paths to
`index.html` (a "SPA fallback" / rewrite rule), or deep links like
`/product/AJ4-THDR-BY` will 404 on refresh.

## Project structure

```
src/
  lib/
    config.js     — API base URL (reads VITE_API_BASE)
    api.js        — catalog, orders, coupons, cart/wishlist sync, tracking
    auth.js       — register/login/session, token storage
  context/
    AuthContext.jsx  — logged-in user state
    ShopContext.jsx  — cart, wishlist, discount, toast, catalog, server sync
  components/
    Layout.jsx      — nav, mobile menu, footer, toast (wraps every page)
    ProductCard.jsx — shared product tile used on Home/Shop/Search/Wishlist
  pages/            — one file per route (Home, Shop, Product, Cart,
                       Checkout, Confirmation, Account, Wishlist, Login,
                       Register, Search, Track, Contact, About, NewArrivals)
  data/
    fallbackProducts.js — offline catalog used if the API can't be reached
public/
  images/           — product photography + hero video, copied from the
                       original Front-end/images folder
```

## Notes on the conversion

- **Cart/wishlist/auth** are now React Context (`ShopContext`, `AuthContext`)
  instead of the old `window.ELEVEN` global — same behavior (localStorage +
  debounced server sync when logged in, guest-cart merge on login).
- **Routing** uses React Router instead of separate `.html` files. Old
  URLs like `product.html?sku=...` become `/product/:sku`.
- **Styling** was rebuilt with Tailwind using the original brand tokens
  (ink/chalk/charcoal/steel/blue/gold, Bebas Neue + Inter + JetBrains Mono)
  rather than porting the original CSS file line-for-line.
- **Razorpay checkout** is wired the same way as the original (loads the
  Razorpay script, opens the same order/verify flow against the backend).
- The **Contact form** doesn't POST anywhere yet — the original site didn't
  have a backend endpoint for it either. Wire it up to a real endpoint when
  one exists.
