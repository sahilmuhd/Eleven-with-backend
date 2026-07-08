import { useMemo, useState } from 'react'
import { useShop } from '../context/ShopContext'
import ProductCard from '../components/ProductCard'

export default function Search() {
  const { products, productsLoading } = useShop()
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return products.filter((p) =>
      [p.name, p.brand, p.colorway, ...(p.cats || [])].filter(Boolean).some((s) => s.toLowerCase().includes(term))
    )
  }, [q, products])

  return (
    <div className="pt-32 px-6 md:px-12 pb-24">
      <h1 className="font-display text-5xl mb-8">Search</h1>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for a sneaker, brand, or colorway…"
        className="input-field text-lg py-4 mb-12"
      />
      {productsLoading ? (
        <p className="text-steel-dim text-sm">Loading catalog…</p>
      ) : q.trim() === '' ? (
        <p className="text-steel-dim text-sm">Start typing to search {products.length} products.</p>
      ) : results.length === 0 ? (
        <p className="text-steel-dim text-sm">No results for "{q}".</p>
      ) : (
        <>
          <p className="font-mono text-xs text-steel-dim mb-6">{results.length} result{results.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {results.map((p) => <ProductCard key={p.sku} p={p} />)}
          </div>
        </>
      )}
    </div>
  )
}
