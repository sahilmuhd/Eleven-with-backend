import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import ProductCard from '../components/ProductCard'

export default function Shop() {
  const { products, productsLoading } = useShop()
  const [sort, setSort] = useState('featured')
  const [cat, setCat] = useState('All')

  const cats = useMemo(() => {
    const set = new Set()
    products.forEach((p) => (p.cats || []).forEach((c) => set.add(c)))
    return ['All', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    let arr = products
    if (cat !== 'All') arr = arr.filter((p) => (p.cats || []).includes(cat))
    arr = [...arr]
    if (sort === 'newest') arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    return arr
  }, [products, sort, cat])

  return (
    <div className="pt-32 px-6 md:px-12 pb-20">
      <div className="text-xs text-steel-dim font-mono mb-4">
        <Link to="/" className="text-steel-dim no-underline hover:text-chalk">Home</Link> / <span className="text-chalk">Shop</span>
      </div>
      <h1 className="font-display text-5xl md:text-6xl mb-3">All sneakers</h1>
      <p className="text-steel-dim text-sm max-w-xl mb-10">
        Every ELEVEN silhouette in one place — running, casual, slides, and limited archive pieces.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs uppercase tracking-wide px-3.5 py-2 border transition ${cat === c ? 'bg-chalk text-ink border-chalk' : 'border-line text-steel-dim hover:border-chalk hover:text-chalk'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-line">
        <span className="font-mono text-xs text-steel-dim">
          {productsLoading ? '— results' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-charcoal border border-line text-xs px-3 py-2 text-chalk"
        >
          <option value="featured">Sort: Featured</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {productsLoading ? (
        <p className="text-steel-dim text-sm py-16 text-center">Loading products…</p>
      ) : filtered.length === 0 ? (
        <p className="text-steel-dim text-sm py-16 text-center">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
          {filtered.map((p) => <ProductCard key={p.sku} p={p} />)}
        </div>
      )}
    </div>
  )
}
