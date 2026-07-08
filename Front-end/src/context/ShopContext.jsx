import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { fetchCatalog, fetchServerCart, pushServerCart, fetchServerWishlist, pushServerWishlist, isLoggedIn } from '../lib/api'

const CART_KEY = 'eleven_cart'
const WISH_KEY = 'eleven_wish'
const DISCOUNT_KEY = 'eleven_discount'
const COUPON_KEY = 'eleven_coupon'

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readJSON(CART_KEY, []))
  const [wishlist, setWishlist] = useState(() => readJSON(WISH_KEY, []))
  const [discountPct, setDiscountPct] = useState(() => Number(localStorage.getItem(DISCOUNT_KEY)) || 0)
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem(COUPON_KEY) || '')
  const [toast, setToast] = useState(null)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const pushTimer = useRef(null)

  // ---- Load catalog once ----
  useEffect(() => {
    fetchCatalog().then((data) => { setProducts(data || []); setProductsLoading(false) })
  }, [])

  // ---- Persist cart/wishlist/discount locally ----
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem(DISCOUNT_KEY, String(discountPct)) }, [discountPct])
  useEffect(() => { localStorage.setItem(COUPON_KEY, couponCode) }, [couponCode])

  // ---- Debounced push to server when logged in ----
  const queuePush = useCallback(() => {
    if (!isLoggedIn()) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushServerCart(cart).catch(() => {})
      pushServerWishlist(wishlist).catch(() => {})
    }, 600)
  }, [cart, wishlist])

  useEffect(() => { queuePush() }, [cart, wishlist, queuePush])

  // Flush on tab close / hide, so nothing gets lost
  useEffect(() => {
    const flush = () => {
      if (!isLoggedIn()) return
      clearTimeout(pushTimer.current)
      pushServerCart(cart).catch(() => {})
      pushServerWishlist(wishlist).catch(() => {})
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
    return () => window.removeEventListener('pagehide', flush)
  }, [cart, wishlist])

  // ---- Pull from server once, if already logged in on load ----
  useEffect(() => {
    if (!isLoggedIn()) return
    ;(async () => {
      const serverCart = await fetchServerCart()
      if (serverCart && Array.isArray(serverCart.items)) setCart(serverCart.items)
      const serverWish = await fetchServerWishlist()
      if (serverWish && Array.isArray(serverWish.skus)) setWishlist(serverWish.skus)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Merge guest cart into server right after login/register ----
  const mergeGuestCartIntoServer = useCallback(async () => {
    if (!isLoggedIn()) return
    const serverCartRes = await fetchServerCart()
    const serverCart = (serverCartRes && serverCartRes.items) || []
    const serverWishRes = await fetchServerWishlist()
    const serverWish = (serverWishRes && serverWishRes.skus) || []

    const merged = [...serverCart]
    cart.forEach((localItem) => {
      const idx = merged.findIndex((i) => i.sku === localItem.sku && i.size === localItem.size)
      if (idx >= 0) merged[idx].qty += localItem.qty
      else merged.push(localItem)
    })
    const mergedWish = Array.from(new Set([...serverWish, ...wishlist]))

    setCart(merged)
    setWishlist(mergedWish)
    pushServerCart(merged).catch(() => {})
    pushServerWishlist(mergedWish).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, wishlist])

  // ---- Cart actions ----
  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.sku === item.sku && i.size === item.size)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + (item.qty || 1) }
        return next
      }
      return [...prev, { ...item, qty: item.qty || 1 }]
    })
  }, [])

  const removeFromCart = useCallback((sku, size) => {
    setCart((prev) => prev.filter((i) => !(i.sku === sku && i.size === size)))
  }, [])

  const changeQty = useCallback((sku, size, delta) => {
    setCart((prev) => prev.map((i) => (i.sku === sku && i.size === size ? { ...i, qty: Math.max(1, i.qty + delta) } : i)))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscountPct(0)
    setCouponCode('')
  }, [])

  const toggleWish = useCallback((sku) => {
    let nowWished = false
    setWishlist((prev) => {
      const has = prev.includes(sku)
      nowWished = !has
      return has ? prev.filter((s) => s !== sku) : [...prev, sku]
    })
    return nowWished
  }, [])

  const isWished = useCallback((sku) => wishlist.includes(sku), [wishlist])

  const applyDiscount = useCallback((pct, code) => {
    setDiscountPct(pct)
    setCouponCode(pct > 0 ? code : '')
  }, [])

  const clearDiscount = useCallback(() => {
    setDiscountPct(0)
    setCouponCode('')
  }, [])

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])
  const cartTotal = useMemo(() => cartSubtotal - cartSubtotal * (discountPct / 100), [cartSubtotal, discountPct])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200)
  }, [])

  const value = {
    products, productsLoading,
    cart, addToCart, removeFromCart, changeQty, clearCart, cartCount, cartSubtotal, cartTotal,
    wishlist, toggleWish, isWished,
    discountPct, couponCode, applyDiscount, clearDiscount,
    toast, showToast,
    mergeGuestCartIntoServer,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  return useContext(ShopContext)
}
