/* ===== ELEVEN — WhatsApp purchase link =====
   Builds a wa.me deep link pre-filled with the product's details.
   Note: a plain wa.me link can only pre-fill *text* — it cannot attach
   the product image automatically. Including the product page URL below
   lets the business tap through and see the photo themselves. */

import { WHATSAPP_NUMBER, SITE_URL } from './config'
import { fmtPrice } from './api'

export function buildWhatsAppLink(product, { size, color } = {}) {
  const lines = [
    `Hi, I'm interested in purchasing:`,
    ``,
    `Product: ${product.name}`,
    `Price: ${fmtPrice(product.price)}`,
  ]
  if (size) lines.push(`Size: ${size}`)
  if (color || product.colorway) lines.push(`Color: ${color || product.colorway}`)
  lines.push(`Product Link: ${SITE_URL}/product/${product.sku}`)
  lines.push(``, `Please share the availability and purchase details.`)

  const message = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
}
