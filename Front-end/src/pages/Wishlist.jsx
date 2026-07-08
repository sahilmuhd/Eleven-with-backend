import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { products, wishlist } = useShop()
  const items = products.filter((p) => wishlist.includes(p.sku))

  return (
    <div className="pt-28 px-6 md:px-12 pb-24">
      <h1 className="font-display text-5xl mb-10">Your wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-steel-dim text-sm mb-6">Nothing saved yet. Tap the heart on any product to add it here.</p>
          <Link to="/shop" className="btn-primary no-underline">Browse the shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
          {items.map((p) => <ProductCard key={p.sku} p={p} />)}
        </div>
      )}
    </div>
  )
}
