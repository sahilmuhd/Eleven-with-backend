import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="pt-40 px-6 text-center pb-24">
      <h1 className="font-display text-6xl mb-4">404</h1>
      <p className="text-steel-dim mb-8">That page doesn't exist — even our archive doesn't go that deep.</p>
      <Link to="/" className="btn-primary no-underline">Back to home</Link>
    </div>
  )
}
