/* ===== ELEVEN — API client =====
   Talks to the Django backend so the shop always reflects whatever is in
   the database. If the API can't be reached, falls back to the last
   successful response cached in localStorage, and finally to the static
   FALLBACK_PRODUCTS catalog — so the site never goes completely blank. */

import { API_BASE } from './config'
import { FALLBACK_PRODUCTS } from '../data/fallbackProducts'
import { authHeader, getToken } from './auth'

const CATALOG_CACHE_KEY = 'eleven_catalog_cache'

let catalogPromise = null

export async function fetchCatalog(force = false) {
  if (catalogPromise && !force) return catalogPromise

  catalogPromise = (async () => {
    try {
      const res = await fetch(API_BASE + '/products/')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
      return data
    } catch (err) {
      console.warn('ELEVEN: could not reach the API, falling back to the offline catalog.', err)
      try {
        const cached = localStorage.getItem(CATALOG_CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length) return parsed
        }
      } catch { /* ignore */ }
      return FALLBACK_PRODUCTS
    }
  })()

  return catalogPromise
}

export async function fetchProduct(sku) {
  try {
    const res = await fetch(API_BASE + '/products/' + encodeURIComponent(sku) + '/')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch {
    const catalog = await fetchCatalog()
    return catalog.find((p) => p.sku === sku) || null
  }
}

export async function submitOrder(payload) {
  const headers = { 'Content-Type': 'application/json', ...authHeader() }
  const res = await fetch(API_BASE + '/orders/', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let body = null
    try { body = await res.json() } catch { /* ignore */ }
    const err = new Error((body && JSON.stringify(body)) || `Order could not be placed (HTTP ${res.status})`)
    err.status = res.status
    err.body = body
    throw err
  }
  return await res.json()
}

export async function verifyPayment(payload) {
  const res = await fetch(API_BASE + '/orders/verify-payment/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let detail = `Payment could not be verified (HTTP ${res.status})`
    try { detail = JSON.stringify(await res.json()) } catch { /* ignore */ }
    throw new Error(detail)
  }
  return await res.json()
}

export async function trackOrder(orderId, phone) {
  const res = await fetch(API_BASE + '/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, phone }),
  })
  if (!res.ok) return null
  return await res.json()
}

export async function validateCoupon(code, subtotal) {
  try {
    const res = await fetch(API_BASE + '/coupons/validate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal: Math.round(subtotal) }),
    })
    const data = await res.json()
    if (!res.ok) return { valid: false, detail: (data && data.detail) || 'Invalid or expired code.' }
    return data
  } catch {
    return { valid: false, detail: 'Could not check that code right now. Please try again.' }
  }
}

export async function fetchServerCart() {
  const res = await fetch(API_BASE + '/cart/', { headers: authHeader() })
  if (!res.ok) return null
  return await res.json()
}

export async function pushServerCart(items) {
  return fetch(API_BASE + '/cart/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ items }),
  })
}

export async function fetchServerWishlist() {
  const res = await fetch(API_BASE + '/wishlist/', { headers: authHeader() })
  if (!res.ok) return null
  return await res.json()
}

export async function pushServerWishlist(skus) {
  return fetch(API_BASE + '/wishlist/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ skus }),
  })
}

export function isLoggedIn() {
  return !!getToken()
}

export function fmtPrice(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
