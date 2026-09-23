import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { fetchCatalog } from '../lib/api'

const WISH_KEY = 'eleven_wish'

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => readJSON(WISH_KEY, []))
  const [toast, setToast] = useState(null)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  // ---- Load catalog once ----
  useEffect(() => {
    fetchCatalog().then((data) => { setProducts(data || []); setProductsLoading(false) })
  }, [])

  // ---- Persist wishlist locally (guest-only, no login needed) ----
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)) }, [wishlist])

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

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200)
  }, [])

  const value = {
    products, productsLoading,
    wishlist, toggleWish, isWished,
    toast, showToast,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  return useContext(ShopContext)
}
