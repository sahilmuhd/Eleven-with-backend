import { useRef, useState, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'

export default function ProductSlider({ products }) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [products, updateArrows])

  const scrollByCard = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-slide]')
    const step = card ? card.offsetWidth + 20 : 260
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div className="relative group/slider">
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.sku} data-slide className="min-w-[220px] w-[220px] sm:min-w-[240px] sm:w-[240px] snap-start">
            <ProductCard p={p} />
          </div>
        ))}
      </div>

      {canPrev && (
        <button
          aria-label="Previous"
          onClick={() => scrollByCard(-1)}
          className="hidden md:flex absolute left-0 top-[38%] -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-chalk text-ink items-center justify-center shadow-lg z-10 opacity-0 group-hover/slider:opacity-100 transition"
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          aria-label="Next"
          onClick={() => scrollByCard(1)}
          className="hidden md:flex absolute right-0 top-[38%] -translate-y-1/2 translate-x-1/2 w-11 h-11 rounded-full bg-chalk text-ink items-center justify-center shadow-lg z-10 opacity-0 group-hover/slider:opacity-100 transition"
        >
          ›
        </button>
      )}
    </div>
  )
}
