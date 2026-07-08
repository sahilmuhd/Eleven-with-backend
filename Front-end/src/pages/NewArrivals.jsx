import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import { useCountdown } from '../hooks/useCountdown'
import { DROP_NAME, DROP_UNITS, DROP_TARGET } from '../data/dropConfig'

export default function NewArrivals() {
  const { products, productsLoading } = useShop()
  const { days, hours, mins, secs, done } = useCountdown(DROP_TARGET)
  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)

  const fresh = products.filter((p) => p.isNew)
  const sale = products.filter((p) => p.onSale)

  return (
    <div className="pb-24">
      {/* HERO */}
      <header className="pt-32 pb-14 px-6 md:px-12">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-gold text-[11px] uppercase tracking-wide font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block pulse-dot" />
            SS26 season
          </div>
          <div className="label-eyebrow mb-2">Just dropped</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-4">New<br />Arrivals</h1>
          <p className="text-steel-dim text-sm max-w-lg">
            The latest silhouettes out of Kammanahalli. Designed from scratch, built for the street. Updated every season — no reruns.
          </p>
        </Reveal>
      </header>

      {/* LIMITED DROP STRIP */}
      <Reveal as="section" className="mx-6 md:mx-12 mb-16 border border-line bg-charcoal">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-gold border border-gold/40 px-2.5 py-1 shrink-0">Limited drop</span>
            <div>
              <h3 className="font-display text-xl md:text-2xl">{DROP_NAME}</h3>
              <p className="text-xs text-steel-dim">{DROP_UNITS} pairs. One release. Gone when they're gone.</p>
            </div>
          </div>
          {!done && (
            <div className="flex gap-5">
              {[['Days', days], ['Hrs', hours], ['Min', mins], ['Sec', secs]].map(([lbl, val]) => (
                <div key={lbl} className="text-center">
                  <div key={val} className="font-mono text-xl digit-flip">{String(val).padStart(2, '0')}</div>
                  <div className="text-[10px] uppercase tracking-wide text-steel-dim">{lbl}</div>
                </div>
              ))}
            </div>
          )}
          <Link to="/shop" className="btn-primary no-underline shrink-0">Shop the drop</Link>
        </div>
      </Reveal>

      {/* FRESH THIS SEASON */}
      <section className="px-6 md:px-12 mb-16">
        <Reveal className="flex items-end justify-between mb-8">
          <div>
            <div className="label-eyebrow mb-2">SS26 collection</div>
            <h2 className="font-display text-3xl md:text-4xl">Fresh this season</h2>
          </div>
          <span className="font-mono text-xs text-steel-dim">{fresh.length} new style{fresh.length === 1 ? '' : 's'}</span>
        </Reveal>
        {productsLoading ? (
          <p className="text-steel-dim text-sm py-16 text-center">Loading…</p>
        ) : fresh.length === 0 ? (
          <p className="text-steel-dim text-sm py-16 text-center">Nothing new right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {fresh.map((p, i) => <Reveal key={p.sku} delay={(i % 4) * 80}><ProductCard p={p} /></Reveal>)}
          </div>
        )}
      </section>

      {/* MARKED DOWN */}
      {!productsLoading && sale.length > 0 && (
        <section className="px-6 md:px-12 pt-12 border-t border-line">
          <Reveal className="flex items-end justify-between mb-8">
            <div>
              <div className="label-eyebrow mb-2">On sale now</div>
              <h2 className="font-display text-3xl md:text-4xl">Marked down</h2>
            </div>
            <span className="font-mono text-xs text-steel-dim">{sale.length} style{sale.length === 1 ? '' : 's'}</span>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
            {sale.map((p, i) => <Reveal key={p.sku} delay={(i % 4) * 80}><ProductCard p={p} /></Reveal>)}
          </div>
        </section>
      )}

      {/* NOTIFY BAND */}
      <Reveal as="section" className="mt-20 mx-6 md:mx-12 border-t border-line pt-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="label-eyebrow text-gold mb-3">Be first in line</div>
          <h2 className="font-display text-4xl mb-3">Drop alerts</h2>
          <p className="text-steel-dim text-sm mb-8">Get notified the moment a new style lands. No spam — just sneakers.</p>
          {!notified ? (
            <form
              className="flex gap-2.5 justify-center flex-wrap mb-5"
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
              <button type="submit" className="btn-primary">Notify me</button>
            </form>
          ) : (
            <p className="text-gold text-sm mb-5">✓ You're on the list — we'll reach out before the drop.</p>
          )}
          <a
            href="https://wa.me/917560943996?text=Hey%20ELEVEN%20%E2%80%94%20add%20me%20to%20drop%20alerts%20please!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-steel-dim no-underline hover:text-chalk transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
            Or get alerts on WhatsApp
          </a>
        </div>
      </Reveal>
    </div>
  )
}
