import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { fetchProduct } from '../lib/api'
import { fmtPrice } from '../lib/api'

export default function Product() {
  const { sku } = useParams()
  const navigate = useNavigate()
  const { addToCart, isWished, toggleWish, showToast } = useShop()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchProduct(sku).then((data) => {
      setP(data)
      setLoading(false)
      setImgIdx(0)
      setQty(1)
      const inStock = Array.isArray(data?.sizesInStock) ? data.sizesInStock : data?.sizes || []
      const firstAvailable = (data?.sizes || []).find((s) => inStock.includes(s))
      setSize(firstAvailable ? 'UK ' + firstAvailable : null)
    })
  }, [sku])

  const inStockSizes = useMemo(() => (Array.isArray(p?.sizesInStock) ? p.sizesInStock : p?.sizes || []), [p])
  const soldOut = p && inStockSizes.length === 0

  if (loading) return <div className="pt-40 text-center text-steel-dim">Loading…</div>
  if (!p) return (
    <div className="pt-40 text-center">
      <p className="text-steel-dim mb-4">We couldn't find that product.</p>
      <Link to="/shop" className="btn-outline no-underline">Back to shop</Link>
    </div>
  )

  const wished = isWished(p.sku)
  const images = p.images && p.images.length ? p.images : ['']

  const handleAdd = () => {
    if (!size) { setSizeError(true); return }
    setSizeError(false)
    addToCart({ sku: p.sku, name: p.name, size, color: p.colorway, price: p.price, image: images[0], qty })
    showToast(p.name + ' added to cart')
  }

  const handleBuyNow = () => {
    if (!size) { setSizeError(true); return }
    handleAdd()
    navigate('/checkout')
  }

  return (
    <div className="pt-28 px-6 md:px-12 pb-24">
      <div className="text-xs text-steel-dim font-mono mb-8">
        <Link to="/" className="text-steel-dim no-underline hover:text-chalk">Home</Link> /{' '}
        <Link to="/shop" className="text-steel-dim no-underline hover:text-chalk">Shop</Link> /{' '}
        <span className="text-chalk">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square bg-charcoal overflow-hidden mb-3">
            {images[imgIdx] && (
              <img src={images[imgIdx]} alt={`${p.name} — angle ${imgIdx + 1}`} className="w-full h-full object-contain relative z-10" />
            )}
            {p.isNew && <span className="absolute top-4 left-4 z-20 bg-blue text-chalk text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">New</span>}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-ink/60 flex items-center justify-center">‹</button>
                <button onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-ink/60 flex items-center justify-center">›</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 overflow-hidden border ${i === imgIdx ? 'border-chalk' : 'border-line'}`}>
                  <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="font-mono text-xs text-steel-dim mb-2">ELV-{p.sku}</div>
          <h1 className="font-display text-4xl md:text-5xl mb-1">{p.name}</h1>
          <div className="text-gold text-xs uppercase tracking-wide font-semibold mb-6">{p.brand} · {p.colorway}</div>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-mono text-2xl">{fmtPrice(p.price)}</span>
            {p.strike > p.price && (
              <>
                <span className="font-mono text-steel-dim line-through text-sm">{fmtPrice(p.strike)}</span>
                <span className="text-gold text-xs font-semibold">Save {Math.round((1 - p.price / p.strike) * 100)}%</span>
              </>
            )}
          </div>

          <div className="mb-8">
            <h4 className="text-xs uppercase tracking-wide text-steel-dim mb-3">Size {size ? `— ${size}` : ''}</h4>
            <div className="flex flex-wrap gap-2">
              {(p.sizes || []).map((s) => {
                const oos = !inStockSizes.includes(s)
                const selected = size === 'UK ' + s
                return (
                  <button
                    key={s}
                    disabled={oos}
                    title={oos ? 'Out of stock' : undefined}
                    onClick={() => { setSize('UK ' + s); setSizeError(false) }}
                    className={`w-12 h-12 text-sm border transition ${oos ? 'border-line text-steel-dim/40 line-through cursor-not-allowed' : selected ? 'border-chalk bg-chalk text-ink font-semibold' : 'border-line hover:border-chalk'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {sizeError && <p className="text-red-400 text-xs mt-3 border border-red-400 px-3 py-2">Please select a size before adding to cart.</p>}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-line">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 text-lg">−</button>
              <span className="w-10 text-center font-mono">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 text-lg">+</button>
            </div>
            <button
              onClick={() => { const now = toggleWish(p.sku); showToast(now ? 'Added to wishlist' : 'Removed from wishlist') }}
              className={`text-xs uppercase tracking-wide flex items-center gap-2 ${wished ? 'text-gold' : 'text-steel-dim'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wished ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <div className="flex gap-3 mb-10">
            <button disabled={soldOut} onClick={handleAdd} className="btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {soldOut ? 'Out of stock' : 'Add to cart'}
            </button>
            <button disabled={soldOut} onClick={handleBuyNow} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              Buy now
            </button>
          </div>

          <p className="text-sm text-steel-dim leading-relaxed">{p.desc}</p>
        </div>
      </div>
    </div>
  )
}
