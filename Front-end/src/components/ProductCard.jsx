import { useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { fmtPrice } from '../lib/api'

export default function ProductCard({ p }) {
  const navigate = useNavigate()
  const { isWished, toggleWish, addToCart, showToast } = useShop()
  const wished = isWished(p.sku)
  const img = (p.images && p.images[0]) || ''

  const handleWish = (e) => {
    e.stopPropagation()
    const nowWished = toggleWish(p.sku)
    showToast(nowWished ? 'Added to wishlist' : 'Removed from wishlist')
  }

  const handleQuickAdd = (e) => {
    e.stopPropagation()
    addToCart({
      sku: p.sku,
      name: p.name,
      size: 'UK ' + ((p.sizes && p.sizes[0]) || 8),
      color: p.colorway || 'Charcoal',
      price: p.price,
      image: img,
    })
    showToast(p.name + ' added to cart')
  }

  return (
    <div
      className="cursor-pointer group"
      onClick={() => navigate(`/product/${p.sku}`)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
        {p.isNew && <span className="absolute top-3 left-3 z-10 bg-blue text-chalk text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">New</span>}
        {!p.isNew && p.onSale && <span className="absolute top-3 left-3 z-10 bg-gold text-ink text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">Sale</span>}
        <button
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWish}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-ink/60 backdrop-blur transition ${wished ? 'text-blue' : 'text-chalk'}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {img && (
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="pt-4">
        <div className="text-[11px] uppercase tracking-wide text-steel-dim mb-1">{p.brand || ''}</div>
        <h4 className="font-display text-lg tracking-wide leading-tight mb-2">{p.name}</h4>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(p.sizes || []).slice(0, 6).map((s) => (
            <span key={s} className="text-[10px] border border-line px-1.5 py-0.5 text-steel-dim">UK {s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm">{fmtPrice(p.price)}</span>
          <button
            onClick={handleQuickAdd}
            className="text-[11px] uppercase tracking-wide font-semibold border border-steel/40 px-3 py-1.5 hover:border-chalk transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
