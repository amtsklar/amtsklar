// AmtsKlar — Paddle Webhook Handler
// Verarbeitet Subscription-Events und speichert Status in KV (oder als Cookie)
// WICHTIG: PADDLE_WEBHOOK_SECRET als Cloudflare Secret hinterlegen

interface Env {
  PADDLE_WEBHOOK_SECRET: string
  // Optional: KV Namespace für Subscription-Status
  // SUBSCRIPTIONS?: KVNamespace
}

// Paddle HMAC Signature verifizieren
async function verifyPaddleSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    // Paddle sendet: "ts=TIMESTAMP;h1=HMAC_HASH"
    const parts = signatureHeader.split(';')
    const tsPart  = parts.find(p => p.startsWith('ts='))
    const h1Part  = parts.find(p => p.startsWith('h1='))
    if (!tsPart || !h1Part) return false

    const ts   = tsPart.split('=')[1]
    const hash = h1Part.split('=')[1]

    // HMAC-SHA256 über "ts:body"
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    )
    const sig = await crypto.subtle.sign(
      'HMAC', key, encoder.encode(`${ts}:${body}`)
    )
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return computed === hash
  } catch {
    return false
  }
}

// Plan aus Paddle-Preisen ableiten
function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    'pri_01ksft9sb5nbptry9pyyd6q54y': 'verstehen',
    'pri_01kspy294ejb2cye55ahj4ypj1': 'verstehen',
    'pri_01ksftcj51p1jsmjk2pr0jbcat': 'handeln',
    'pri_01kspy5h321a355ngn0qhjn5m4': 'handeln',
    'pri_01ksftg5nw1a2nztra644zhd5a': 'familie',
    'pri_01kspy9q00s8k4v4hsw6j3trmr': 'familie',
  }
  return map[priceId] || 'verstehen'
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body      = await context.request.text()
    const signature = context.request.headers.get('Paddle-Signature')

    if (!signature) {
      console.error('[Paddle] Missing signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Signatur nur prüfen wenn Secret vorhanden
    if (context.env.PADDLE_WEBHOOK_SECRET) {
      const valid = await verifyPaddleSignature(
        body, signature, context.env.PADDLE_WEBHOOK_SECRET
      )
      if (!valid) {
        console.error('[Paddle] Invalid signature')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const event    = JSON.parse(body)
    const type     = event.event_type as string
    const data     = event.data || {}
    const email    = data.customer?.email || data.address?.email || ''
    const priceId  = data.items?.[0]?.price?.id || ''
    const plan     = planFromPriceId(priceId)
    const subId    = data.id || ''

    console.log(`[Paddle] ${type} | ${email} | ${plan} | sub:${subId}`)

    switch (type) {

      case 'subscription.created':
      case 'subscription.activated':
        // Abo aktiv — in KV speichern (wenn vorhanden)
        console.log(`✅ Abo aktiviert: ${email} → ${plan}`)
        // TODO mit KV: await context.env.SUBSCRIPTIONS.put(email, JSON.stringify({ plan, active: true, subId }))
        break

      case 'subscription.updated':
        // Plan-Wechsel
        console.log(`🔄 Abo geändert: ${email} → ${plan}`)
        break

      case 'subscription.canceled':
        // Abo gekündigt — Zugang entziehen
        console.log(`❌ Abo gekündigt: ${email}`)
        // TODO mit KV: await context.env.SUBSCRIPTIONS.put(email, JSON.stringify({ plan: 'none', active: false, subId }))
        break

      case 'subscription.past_due':
        // Zahlung fehlgeschlagen
        console.log(`⚠️ Zahlung fehlgeschlagen: ${email}`)
        break

      case 'subscription.paused':
        console.log(`⏸️ Abo pausiert: ${email}`)
        break

      case 'transaction.completed':
        // Einmalkauf oder erste Zahlung
        console.log(`💳 Zahlung erfolgreich: ${email} | ${plan}`)
        break

      case 'transaction.payment_failed':
        console.log(`❌ Zahlung fehlgeschlagen: ${email}`)
        break

      default:
        console.log(`[Paddle] Unhandled event: ${type}`)
    }

    return new Response(JSON.stringify({ received: true, type }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[Paddle] Error:', err)
    return new Response('Internal error', { status: 500 })
  }
}
