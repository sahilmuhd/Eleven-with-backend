import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/new-arrivals', label: 'New Arrivals' },
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Contact' },
  { to: '/track', label: 'Track Order' },
]

function Icon({ path, ...props }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      {path}
    </svg>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount, toast } = useShop()
  const { user } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 py-6 mix-blend-difference max-[900px]:mix-blend-normal">
        <Link to="/" className="font-display text-2xl tracking-wider text-chalk no-underline">ELEVEN</Link>

        <ul className="hidden md:flex gap-9 list-none">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `text-chalk no-underline text-[13px] tracking-wide uppercase font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/search" aria-label="Search" className="text-chalk p-1">
            <Icon path={<><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />
          </Link>
          <Link to="/wishlist" aria-label="Wishlist" className="text-chalk p-1">
            <Icon path={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />} />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative text-chalk p-1">
            <Icon path={<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue text-chalk text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          <Link to={user ? '/account' : '/login'} aria-label="Account" className="text-chalk no-underline p-1 inline-flex items-center gap-1.5">
            <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
            <span className="text-xs whitespace-nowrap">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Account'}</span>
          </Link>
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent border-none cursor-pointer p-1 z-[200]"
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`block w-[22px] h-0.5 bg-chalk rounded transition-all ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block w-[22px] h-0.5 bg-chalk rounded transition-all ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-[22px] h-0.5 bg-chalk rounded transition-all ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[150] bg-ink flex flex-col pt-24 px-8 md:hidden">
          {[...NAV_LINKS, { to: '/search', label: 'Search' }, { to: '/wishlist', label: 'Wishlist' }, { to: user ? '/account' : '/login', label: user ? `Hi, ${user.name.split(' ')[0]}` : 'Account' }].map((l) => (
            <NavLink
              key={l.to + l.label}
              to={l.to}
              onClick={closeMenu}
              className="border-t border-line py-5 text-chalk no-underline text-lg font-display tracking-wide"
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}

      <main className="min-h-screen">
        <Outlet />
      </main>

      <footer className="border-t border-line px-6 md:px-12 pt-20 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-3xl mb-3.5">ELEVEN</div>
            <p className="text-[13px] text-steel-dim max-w-[260px] leading-relaxed">
              Built different. An original footwear label out of Bangalore, designing sneakers for the street, not the showroom.
            </p>
          </div>
          <div>
            <h5 className="text-xs tracking-wide uppercase text-steel-dim mb-4">Shop</h5>
            <Link to="/new-arrivals" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">New arrivals</Link>
            <Link to="/shop" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Best sellers</Link>
            <Link to="/shop" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Limited edition</Link>
            <Link to="/shop" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Men</Link>
            <Link to="/shop" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Women</Link>
          </div>
          <div>
            <h5 className="text-xs tracking-wide uppercase text-steel-dim mb-4">Support</h5>
            <Link to="/contact" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Shipping policy</Link>
            <Link to="/contact" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Return policy</Link>
            <Link to="/track" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Order tracking</Link>
            <Link to="/contact" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">FAQ</Link>
            <Link to="/contact" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Contact</Link>
          </div>
          <div>
            <h5 className="text-xs tracking-wide uppercase text-steel-dim mb-4">Connect</h5>
            <a href="https://instagram.com/elevenfootwear" target="_blank" rel="noopener noreferrer" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Instagram</a>
            <a href="https://wa.me/917560943996" target="_blank" rel="noopener noreferrer" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">WhatsApp</a>
            <a href="mailto:sahilmuhd123@gmail.com" className="block text-chalk no-underline text-sm mb-2.5 opacity-85 hover:opacity-100 hover:text-blue">Email</a>
          </div>
        </div>
        <div className="flex justify-between items-center pt-6 border-t border-line text-xs text-steel-dim flex-wrap gap-2">
          <span>© 2026 ELEVEN Footgear Hub. All rights reserved.</span>
          <span className="font-mono">Kammanahalli, Bangalore</span>
          <span className="font-mono">Created by <a href="https://sahilmuhd.com/" target="_blank" rel="noopener noreferrer" className="text-inherit">sahilmuhd.com</a></span>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-chalk text-ink px-6 py-3 text-[13px] font-semibold tracking-wide z-[9999] whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  )
}
