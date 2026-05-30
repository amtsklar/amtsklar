/**
 * AmtsKlar — Österreichische Behördenbriefe sofort verstehen
 * Copyright © 2025-2026 STAR:HORIZON LTD
 * Alle Rechte vorbehalten. All rights reserved.
 *
 * Unauthorized copying, modification, distribution or use of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 *
 * www.amtsklar.at | info@amtsklar.at
 */

interface Env {
  PADDLE_API_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { email } = await context.request.json() as { email: string }

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ active: false, error: 'Ungültige E-Mail' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Paddle API: aktive Subscriptions prüfen
    const res = await fetch('https://api.paddle.com/subscriptions?status=active&per_page=50', {
      headers: {
        Authorization: `Bearer ${context.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ active: false, error: 'Paddle API nicht erreichbar' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await res.json() as any
    const subs = data.data || []

    // Prüfe ob E-Mail eine aktive Subscription hat
    // Paddle speichert Kunden-E-Mail im customer_id - wir suchen über Kundendaten
    const active = subs.some((sub: any) =>
      sub.status === 'active' &&
      sub.customer?.email?.toLowerCase() === email.toLowerCase()
    )

    if (active) {
      return new Response(JSON.stringify({ active: true, status: 'active' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Auch trialing prüfen
    const trialRes = await fetch('https://api.paddle.com/subscriptions?status=trialing&per_page=50', {
      headers: { Authorization: `Bearer ${context.env.PADDLE_API_KEY}` }
    })
    const trialData = await trialRes.json() as any
    const trialing = (trialData.data || []).some((sub: any) =>
      sub.customer?.email?.toLowerCase() === email.toLowerCase()
    )

    return new Response(JSON.stringify({ active: trialing, status: trialing ? 'trialing' : 'none' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ active: false, error: 'Fehler bei Prüfung' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
