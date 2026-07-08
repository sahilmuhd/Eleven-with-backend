import { useState } from 'react'
import { Link } from 'react-router-dom'

const CHANNELS = [
  {
    to: '/track',
    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    title: 'Track your order',
    desc: 'Enter your order ID and phone number to see live status',
    internal: true,
  },
  {
    href: 'https://wa.me/917560943996',
    icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
    title: 'WhatsApp',
    desc: 'Fastest response · Usually replies in under 2 hours',
  },
  {
    href: 'mailto:sahilmuhd123@gmail.com',
    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    title: 'Email',
    desc: 'sahilmuhd123@gmail.com · Reply within 24 hours',
  },
  {
    href: 'https://instagram.com/elevenfootwear',
    icon: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
    title: 'Instagram',
    desc: '@elevenfootwear · DMs open for drop info and collabs',
  },
]

const FAQS = [
  ['How do I track my order?', "Once your order ships, you'll get an SMS and email with a tracking link. Delivery takes 3–6 business days for standard and 1–2 for express. For any issues, drop us a WhatsApp — we'll sort it out same day."],
  ["What's the return and exchange policy?", 'Returns and exchanges are accepted within 14 days of delivery, as long as the pair is unworn and in original packaging. Limited edition drops are final sale. To initiate a return, use the form on this page or WhatsApp us your order ID.'],
  ['How does ELEVEN sizing run?', "All sizes are in UK. Our runners and mid-tops tend to run true to size. Casual silhouettes run slightly wide — if you're between sizes, go down. When in doubt, share your foot length in cm via WhatsApp and we'll guide you to the right fit."],
  ['Do you ship outside India?', "Not yet — we're India-only for now. International shipping is on our roadmap for later this year. If you're outside India and want to be notified when it launches, send us your email via the form and we'll add you to the list."],
  ['Can I collaborate with ELEVEN?', 'We\u2019re open to the right collabs — artists, photographers, stylists, and brands whose aesthetic aligns with ours. Use the contact form, select "Collaboration" as the topic, and tell us what you have in mind. We read every pitch.'],
]

const TOPICS = ['Order issue', 'Returns', 'Sizing', 'Collaboration', 'Other']

function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
}

function ChannelRow({ c }) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-chalk shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{c.icon}</svg>
        </div>
        <div>
          <strong className="block text-sm">{c.title}</strong>
          <span className="text-xs text-steel-dim">{c.desc}</span>
        </div>
      </div>
      <span className="text-steel-dim"><ArrowIcon /></span>
    </>
  )
  const className = 'flex items-center justify-between gap-4 border border-line px-5 py-4 no-underline text-chalk hover:border-chalk transition'
  return c.internal ? (
    <Link to={c.to} className={className}>{content}</Link>
  ) : (
    <a href={c.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
  )
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-line">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-medium">
        <span>{q}</span>
        <span className={`shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </span>
      </button>
      {open && <p className="text-xs text-steel-dim leading-relaxed pb-4 pr-8">{a}</p>}
    </div>
  )
}

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(null)
  const [topic, setTopic] = useState('Order issue')
  const [fields, setFields] = useState({ orderId: '', name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [waLink, setWaLink] = useState('')
  const set = (k, v) => setFields((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const checks = {
      name: fields.name.trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()),
      message: fields.message.trim().length > 0,
    }
    setErrors(checks)
    if (!Object.values(checks).every(Boolean)) return

    const lines = [
      `New ${topic} message from the website:`,
      fields.orderId ? `Order ID: ${fields.orderId}` : null,
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      `Message: ${fields.message}`,
    ].filter(Boolean)
    const link = 'https://wa.me/917560943996?text=' + encodeURIComponent(lines.join('\n'))
    setWaLink(link)
    window.open(link, '_blank', 'noopener')
    setSent(true)
  }

  const resetForm = () => {
    setSent(false)
    setFields({ orderId: '', name: '', email: '', message: '' })
    setErrors({})
  }

  return (
    <div className="pt-32 px-6 md:px-12 pb-24">
      <div className="text-xs text-steel-dim font-mono mb-4">
        <Link to="/" className="text-steel-dim no-underline hover:text-chalk">Home</Link> / <span className="text-chalk">Contact</span>
      </div>
      <h1 className="font-display text-5xl md:text-6xl mb-4">Get in<br />touch</h1>
      <p className="text-steel-dim max-w-lg mb-16">
        Questions about an order, sizing, or a collaboration idea? We're a small team — real people reply to every message.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16">
        {/* LEFT — channels + FAQ */}
        <div>
          <div className="flex flex-col gap-3 mb-16">
            {CHANNELS.map((c) => <ChannelRow key={c.title} c={c} />)}
          </div>

          <div className="label-eyebrow mb-4">Common questions</div>
          <div>
            {FAQS.map(([q, a], i) => (
              <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="border border-line p-6 md:p-8 h-fit">
          {!sent ? (
            <>
              <h2 className="font-display text-2xl mb-1">Send a message</h2>
              <p className="text-xs text-steel-dim mb-6">We aim to reply within 24 hours on business days.</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`text-xs uppercase tracking-wide px-3 py-2 border transition ${topic === t ? 'bg-chalk text-ink border-chalk' : 'border-line text-steel-dim hover:border-chalk hover:text-chalk'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {topic === 'Order issue' && (
                  <div>
                    <label className="text-xs text-steel-dim block mb-1.5">Order ID</label>
                    <input value={fields.orderId} onChange={(e) => set('orderId', e.target.value)} placeholder="ELV-2026-XXXXX" className="input-field" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-steel-dim block mb-1.5">Your name</label>
                  <input value={fields.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={`input-field ${errors.name === false ? 'border-red-400' : ''}`} />
                  {errors.name === false && <p className="text-red-400 text-xs mt-1">Please enter your name.</p>}
                </div>
                <div>
                  <label className="text-xs text-steel-dim block mb-1.5">Email address</label>
                  <input type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} placeholder="name@email.com" className={`input-field ${errors.email === false ? 'border-red-400' : ''}`} />
                  {errors.email === false && <p className="text-red-400 text-xs mt-1">Enter a valid email address.</p>}
                </div>
                <div>
                  <label className="text-xs text-steel-dim block mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    value={fields.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder="Tell us what's up — the more detail, the faster we can help."
                    className={`input-field resize-none ${errors.message === false ? 'border-red-400' : ''}`}
                  />
                  {errors.message === false && <p className="text-red-400 text-xs mt-1">Please write a message.</p>}
                </div>
                <button type="submit" className="btn-primary w-full mt-2">Send message</button>
                <p className="text-[11px] text-steel-dim text-center">By sending a message you agree to be contacted at the email address provided.</p>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-blue/15 text-blue flex items-center justify-center mx-auto mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 className="font-display text-2xl mb-3">Message sent</h3>
              <p className="text-sm text-steel-dim leading-relaxed mb-2">
                Your message has been sent to us on WhatsApp. We'll reply to <strong className="text-chalk">{fields.email}</strong> within 24 hours.
              </p>
              <p className="text-xs text-steel-dim mb-6">
                Didn't open WhatsApp? <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-gold no-underline">Tap here to resend →</a>
              </p>
              <button onClick={resetForm} className="btn-outline">Send another message</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
