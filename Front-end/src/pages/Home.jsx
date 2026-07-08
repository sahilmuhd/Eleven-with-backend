import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import ProductSlider from '../components/ProductSlider'
import Reveal from '../components/Reveal'
import { useCountdown } from '../hooks/useCountdown'
import { DROP_NAME, DROP_UNITS, DROP_TARGET } from '../data/dropConfig'

const COLLECTIONS = [
  { sku: 'AJ4-THDR-BY', label: 'N°01 — JORDAN', title: 'Air Jordan 4', flag: 'Bestseller', img: '/images/products/aj4-thunder/1.jpeg' },
  { sku: 'NB-9060-NRG', label: 'N°02 — NB', title: 'New Balance', flag: null, img: '/images/products/nb-9060-nori/1.jpeg' },
  { sku: 'NK-CTZ-WGO', label: 'N°03 — NIKE', title: 'Classics', flag: null, img: '/images/products/nike-cortez/1.jpeg' },
  { sku: 'SBD-STU-001', label: 'N°04 — LIMITED', title: 'Drops archive', flag: "Editor's Pick", img: '/images/products/sb-dunk-stussy/1.jpeg' },
]

const WHY = [
  { n: '01', title: 'Original by design', body: "Every silhouette starts from a blank sketchpad. No reskins, no clones — just ELEVEN's own design language." },
  { n: '02', title: 'Built for the street', body: 'Materials and construction tested for daily wear, not just shelf appeal. Comfort engineered in, not bolted on.' },
  { n: '03', title: 'All-India delivery', body: 'Dispatched from Bangalore, delivered nationwide. Track every step from cutting room to your doorstep.' },
]

const TICKER_WORDS = ['BUILT DIFFERENT', 'NO RESKINS', 'EST. KAMMANAHALLI', 'ORIGINAL SILHOUETTES', 'SHIPPED FROM BANGALORE']

function Ticker() {
  const items = [...TICKER_WORDS, ...TICKER_WORDS]
  return (
    <div className="border-y border-line overflow-hidden py-4 bg-charcoal">
      <div className="marquee-track">
        {[0, 1].map((rep) => (
          <div key={rep} className="flex shrink-0">
            {items.map((w, i) => (
              <span key={rep + '-' + i} className="flex items-center font-mono text-xs uppercase tracking-[0.2em] text-steel-dim px-6 whitespace-nowrap">
                {w}
                <span className="ml-6 text-blue">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { products, productsLoading } = useShop()
  const { days, hours, mins, secs, done } = useCountdown(DROP_TARGET)
  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)

  const authenticDrops = products.slice(0, 8)
  const newArrivals = products.filter((p) => p.isNew).slice(0, 8)

  return (
    <>
      {/* HERO */}
      <header className="relative min-h-[680px] h-screen flex flex-col justify-center px-6 md:px-12 overflow-hidden bg-ink">
        <video className="absolute inset-0 w-full h-full object-cover z-0" autoPlay muted loop playsInline poster="/images/hero-bg-poster.jpg">
          <source src="/images/hero-bg.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 75% 30%, rgba(47,111,237,0.13), transparent 60%), linear-gradient(180deg, rgba(10,10,12,0.80) 0%, rgba(10,10,12,0.45) 14%, rgba(10,10,12,0.40) 50%, rgba(10,10,12,0.55) 70%, rgba(10,10,12,0.82) 100%)',
          }}
        />
        <div className="relative z-10">
          <div className="animate-hero-rise font-display leading-[0.85] text-[clamp(64px,13vw,168px)]" style={{ animationDelay: '0.05s' }}>BUILT</div>
          <div className="h-px bg-line my-2" />
          <div className="animate-hero-rise font-display leading-[0.85] text-[clamp(64px,13vw,168px)] text-right" style={{ animationDelay: '0.2s' }}>DIFFERENT</div>
        </div>

        <div className="animate-hero-rise relative z-10 mt-10 flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ animationDelay: '0.4s' }}>
          <p className="max-w-md text-sm text-steel-dim leading-relaxed">
            <span className="font-mono block text-blue mb-2">// EST. KAMMANAHALLI</span>
            Original silhouettes engineered for the street. No templates, no shortcuts — every pair designed from a blank page.
          </p>
          <div className="flex gap-4">
            <Link to="/shop" className="btn-primary no-underline hover:shadow-[0_0_30px_rgba(47,111,237,0.35)]">Shop now</Link>
            <button
              className="btn-outline bg-transparent"
              onClick={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore collection
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-steel-dim animate-bounce">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-line" />
        </div>
      </header>

      <Ticker />

      {/* COLLECTIONS */}
      <section id="collections" className="px-6 md:px-12 py-20">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <div className="label-eyebrow mb-2">Featured</div>
            <h2 className="font-display text-4xl md:text-5xl">Collections</h2>
          </div>
          <div className="font-mono text-xs text-steel-dim hidden md:block">04 categories</div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {COLLECTIONS.map((c, i) => (
            <Reveal key={c.sku} delay={i * 90}>
              <Link
                to={`/product/${c.sku}`}
                className="relative block no-underline text-inherit group overflow-hidden aspect-[3/4] transition-transform duration-300 hover:-translate-y-1.5"
              >
                {c.flag && (
                  <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-ink/70 backdrop-blur text-gold text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6L12 2z" /></svg>
                    {c.flag}
                  </span>
                )}
                <img src={c.img} alt={c.title} className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 ring-1 ring-inset ring-blue/50" />
                <div className="absolute bottom-0 left-0 p-4">
                  <span className="font-mono text-[10px] text-steel-dim block mb-1">{c.label}</span>
                  <h3 className="font-display text-xl md:text-2xl">{c.title}</h3>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AUTHENTIC DROPS RAIL */}
      <section className="px-6 md:px-12 py-16 border-t border-line">
        <Reveal className="flex items-end justify-between mb-8">
          <div>
            <div className="label-eyebrow mb-2">Verified stock</div>
            <h2 className="font-display text-3xl md:text-4xl">Authentic drops</h2>
          </div>
          <Link to="/shop" className="font-mono text-xs text-steel-dim no-underline hover:text-chalk transition-colors">
            {products.length} pairs in stock →
          </Link>
        </Reveal>
        {productsLoading ? <p className="text-steel-dim text-sm">Loading…</p> : (
          <Reveal><ProductSlider products={authenticDrops} /></Reveal>
        )}
      </section>

      {/* NEW ARRIVALS RAIL */}
      <section className="px-6 md:px-12 py-16 border-t border-line">
        <Reveal className="flex items-end justify-between mb-8">
          <div>
            <div className="label-eyebrow mb-2">Just landed</div>
            <h2 className="font-display text-3xl md:text-4xl">New arrivals</h2>
          </div>
          <Link to="/new-arrivals" className="font-mono text-xs text-steel-dim no-underline hover:text-chalk transition-colors">
            SS26 — {newArrivals.length} styles →
          </Link>
        </Reveal>
        {productsLoading ? <p className="text-steel-dim text-sm">Loading…</p> : (
          <Reveal><ProductSlider products={newArrivals.length ? newArrivals : authenticDrops} /></Reveal>
        )}
      </section>

      {/* WHY GRID */}
      <section className="px-6 md:px-12 py-20 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-10">
        {WHY.map((w, i) => (
          <Reveal key={w.n} delay={i * 120} className="group">
            <span className="font-mono text-blue text-sm">{w.n}</span>
            <h3 className="font-display text-2xl mt-3 mb-3">{w.title}</h3>
            <p className="text-sm text-steel-dim leading-relaxed">{w.body}</p>
            <div className="h-px bg-line mt-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          </Reveal>
        ))}
      </section>

      {/* DROP BANNER */}
      <section className="relative border-t border-line py-24 px-6 text-center bg-charcoal overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A368 0, transparent 40%), radial-gradient(circle at 80% 70%, #2F6FED 0, transparent 40%)' }}
        />
        <Reveal className="relative max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 text-gold text-xs uppercase tracking-wide font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block pulse-dot" />
            Limited drop
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-3">{DROP_NAME}</h2>
          <p className="text-steel-dim text-sm mb-8">{DROP_UNITS} pairs. One release. Gone when they're gone.</p>
          {done ? (
            <p className="text-gold text-sm mb-8">The drop is live — grab it before it's gone.</p>
          ) : (
            <div className="flex justify-center gap-6 mb-8">
              {[['Days', days], ['Hours', hours], ['Mins', mins], ['Secs', secs]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div key={val} className="font-mono text-3xl digit-flip">{String(val).padStart(2, '0')}</div>
                  <div className="text-[11px] uppercase tracking-wide text-steel-dim mt-1">{lbl}</div>
                </div>
              ))}
            </div>
          )}
          {!notified ? (
            <form
              className="flex gap-2.5 justify-center flex-wrap"
              onSubmit={(e) => { e.preventDefault(); if (email) setNotified(true) }}
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-[240px]"
              />
              <button type="submit" className="btn-primary">{done ? 'Shop the drop' : 'Notify me'}</button>
            </form>
          ) : (
            <p className="text-gold text-sm">✓ You're on the list — we'll reach out before the drop.</p>
          )}
        </Reveal>
      </section>
    </>
  )
}
