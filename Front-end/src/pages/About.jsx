import { Link } from 'react-router-dom'

const STATS = [
  ['2021', 'Founded'],
  ['11', 'Silhouettes'],
  ['∞', 'Blank pages'],
]

const NUMBERS = [
  ['11', 'styles', 'Original silhouettes designed in-house since 2021'],
  ['4', 'years', 'Building and refining the ELEVEN design language'],
  ['0', 'reskins', 'Every design starts from a blank page, no exceptions'],
  ['1', 'city', 'Designed, sampled, and shipped from Bangalore'],
]

function SneakerIllustration() {
  return (
    <svg viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-auto">
      <path d="M40 250 C40 225 80 210 150 203 C230 195 300 170 355 142 C400 120 440 115 472 122 C500 128 518 148 516 172 C513 195 494 215 460 228 C390 252 270 268 160 270 C100 270 40 265 40 250 Z" fill="none" stroke="rgba(201,163,104,0.25)" strokeWidth="1.5" />
      <path d="M40 250 C40 225 80 210 150 203 C230 195 300 170 355 142 C400 120 440 115 472 122 C500 128 518 148 516 172 C513 195 494 215 460 228 C390 252 270 268 160 270 C100 270 40 265 40 250 Z" fill="rgba(35,35,37,0.6)" />
      <path d="M150 203 C170 180 195 165 225 158 M270 195 C295 175 320 162 348 155" stroke="rgba(199,204,209,0.3)" strokeWidth="1.2" fill="none" />
      <path d="M355 142 C370 165 378 190 375 215" stroke="rgba(199,204,209,0.2)" strokeWidth="1" fill="none" />
      <path d="M80 255 C170 262 340 260 460 248 C490 244 510 236 516 226" stroke="rgba(199,204,209,0.15)" strokeWidth="1" fill="none" />
      <text x="250" y="232" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="11" letterSpacing="6" fill="rgba(201,163,104,0.5)">ELEVEN</text>
    </svg>
  )
}

export default function About() {
  return (
    <div className="pb-24">
      {/* HERO */}
      <header className="relative pt-40 pb-16 px-6 md:px-12 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-[22vw] text-chalk/[0.03] select-none pointer-events-none whitespace-nowrap"
        >
          ELEVEN
        </div>
        <div className="relative">
          <div className="label-eyebrow mb-4">Est. Kammanahalli, Bangalore</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-10">
            An original<br />footwear label<br />built different.
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 max-w-4xl">
            <p className="text-steel-dim leading-relaxed max-w-md">
              We didn't set out to make another sneaker brand. We set out to prove that something genuinely new could
              come out of Bangalore — designed from scratch, built for real streets, and sold without the hype tax.
            </p>
            <div className="flex gap-10">
              {STATS.map(([num, label]) => (
                <div key={label}>
                  <div className="font-mono text-3xl md:text-4xl">{num}</div>
                  <div className="text-[11px] uppercase tracking-wide text-steel-dim mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ORIGIN — text + illustration */}
      <section className="px-6 md:px-12 py-20 border-t border-line grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="label-eyebrow mb-3">Where it started</div>
          <h2 className="font-display text-4xl md:text-5xl mb-6">Kammanahalli,<br />2021.</h2>
          <p className="text-steel-dim leading-relaxed mb-4">
            ELEVEN started in a 200 sq ft room in Kammanahalli with a sketchbook, a sewing machine borrowed from a
            tailor down the road, and one question: <strong className="text-chalk">why does every Indian sneaker
            look like a cheaper version of something else?</strong>
          </p>
          <p className="text-steel-dim leading-relaxed mb-4">
            Our founder had spent years in the footwear trade — sourcing materials, visiting factories, watching
            trends arrive from abroad and get copied at cost. The industry ran on imitation. ELEVEN was started to
            break that habit.
          </p>
          <p className="text-steel-dim leading-relaxed mb-8">
            The first silhouette took four months. The second took three. By the time we had five, we had a
            language — <strong className="text-chalk">clean geometry, deliberate proportions, materials chosen for
            feel not label value.</strong> That's still the standard we design to.
          </p>
          <Link to="/shop" className="btn-primary no-underline">See the collection</Link>
        </div>
        <div className="max-w-md mx-auto lg:max-w-none">
          <SneakerIllustration />
        </div>
      </section>

      {/* PILLARS */}
      <section className="px-6 md:px-12 py-20 border-t border-line">
        <div className="mb-10">
          <div className="label-eyebrow mb-3">What we stand for</div>
          <h2 className="font-display text-3xl md:text-4xl">Three things we don't compromise on</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <span className="font-mono text-blue text-sm">01</span>
            <h3 className="font-display text-xl mt-2 mb-3">Original by design</h3>
            <p className="text-steel-dim text-sm leading-relaxed">
              Every silhouette starts from a blank sketchpad. No reskins, no "inspired by" — just ELEVEN's own
              design language, developed over four years and eleven styles. If it looks like something else, we
              scrap it and start again.
            </p>
          </div>
          <div>
            <span className="font-mono text-blue text-sm">02</span>
            <h3 className="font-display text-xl mt-2 mb-3">Built, not assembled</h3>
            <p className="text-steel-dim text-sm leading-relaxed">
              Materials are chosen for how they perform and age, not how they look in a product shot. Construction
              is tested for daily street wear, not shelf life. Every pair goes through the same standards, from our
              everyday slides to our limited trainers.
            </p>
          </div>
          <div>
            <span className="font-mono text-blue text-sm">03</span>
            <h3 className="font-display text-xl mt-2 mb-3">Honest pricing</h3>
            <p className="text-steel-dim text-sm leading-relaxed">
              We don't price for hype. We price for what the shoe costs to make well, plus a margin that keeps us
              running. No artificial scarcity, no limited-edition markups on regular stock.
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 md:px-12 py-20 border-t border-line">
        <div className="mb-10">
          <div className="label-eyebrow mb-3">How we work</div>
          <h2 className="font-display text-3xl md:text-4xl">From blank page to your doorstep</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            ['Step 01', 'Sketch', 'Every pair starts as pencil on paper. No 3D tools until the shape is right by hand — typically 2–6 weeks per silhouette.'],
            ['Step 02', 'Sample', 'Pattern-making and first samples done with our production partner near Varthur. Usually three rounds of samples before we\u2019re satisfied.'],
            ['Step 03', 'Test', 'Wear-tested by the team for at least 30 days before any launch — comfort, sole adhesion, and shape retention.'],
            ['Step 04', 'Ship', 'Dispatched from Bangalore. Every order packed by hand, with nationwide delivery and live tracking.'],
          ].map(([n, t, d]) => (
            <div key={n} className="relative pl-5">
              <div className="absolute left-0 top-1 bottom-1 w-px bg-blue" />
              <div className="font-mono text-xs text-steel-dim mb-2">{n}</div>
              <h4 className="font-display text-xl mb-2">{t}</h4>
              <p className="text-steel-dim text-sm leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NUMBERS */}
      <section className="px-6 md:px-12 py-16 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-8 bg-charcoal">
        {NUMBERS.map(([num, unit, desc]) => (
          <div key={unit}>
            <div className="font-mono text-3xl md:text-4xl mb-1">{num}<span className="text-lg text-steel-dim ml-1">{unit}</span></div>
            <div className="text-xs text-steel-dim leading-relaxed">{desc}</div>
          </div>
        ))}
      </section>

      {/* CLOSING CTA */}
      <section className="px-6 md:px-12 py-20 border-t border-line text-center">
        <h2 className="font-display text-4xl mb-4">Find your pair.</h2>
        <p className="text-steel-dim text-sm mb-8">Eleven original silhouettes. No clones. Shipped from Bangalore to anywhere in India.</p>
        <Link to="/shop" className="btn-primary no-underline">Shop the collection</Link>
      </section>
    </div>
  )
}
