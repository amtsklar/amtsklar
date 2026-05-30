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

// AmtsKlar — Geschützter Vorlagen-Download
// Prüft Abo-Status bevor eine Vorlage ausgeliefert wird
// Nur Handeln & Familie dürfen downloaden

interface Env {
  PADDLE_API_KEY: string
}

// Erlaubte Dateien (Whitelist — keine Path Traversal möglich)
const ALLOWED_FILES: Record<string, string> = {
  '01_Einspruch_Strafverfuegung.docx': '01_Einspruch_Strafverfuegung.docx',
  '02_Beschwerde_Finanzamt.docx':      '02_Beschwerde_Finanzamt.docx',
  '03_Widerspruch_AMS.docx':           '03_Widerspruch_AMS.docx',
  '04_Antwort_Inkasso.docx':           '04_Antwort_Inkasso.docx',
  '05_Einspruch_Miete.docx':           '05_Einspruch_Miete.docx',
}

// Pläne die Download erlauben
const DOWNLOAD_PLANS = ['handeln', 'familie']

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url  = new URL(context.request.url)
  const file = url.searchParams.get('file') || ''
  const email = url.searchParams.get('email') || ''

  // 1. Dateiname gegen Whitelist prüfen (kein Path Traversal)
  const safeFile = ALLOWED_FILES[file]
  if (!safeFile) {
    return new Response('Datei nicht gefunden.', { status: 404 })
  }

  // 2. E-Mail muss vorhanden sein
  if (!email || !email.includes('@')) {
    return new Response(
      JSON.stringify({ error: 'Bitte zuerst E-Mail verifizieren.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 3. Abo-Status bei Paddle prüfen
  if (context.env.PADDLE_API_KEY) {
    try {
      const paddleRes = await fetch(
        `https://api.paddle.com/subscriptions?customer_email=${encodeURIComponent(email)}&status=active`,
        {
          headers: {
            'Authorization': `Bearer ${context.env.PADDLE_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (paddleRes.ok) {
        const data = await paddleRes.json() as any
        const subscriptions = data.data || []

        // Plan-ID aus aktiven Abos extrahieren
        const PLAN_PRICE_IDS: Record<string, string> = {
          'pri_01ksftcj51p1jsmjk2pr0jbcat': 'handeln',
          'pri_01kspy5h321a355ngn0qhjn5m4': 'handeln',
          'pri_01ksftg5nw1a2nztra644zhd5a': 'familie',
          'pri_01kspy9q00s8k4v4hsw6j3trmr': 'familie',
        }

        const hasAccess = subscriptions.some((sub: any) => {
          const priceId = sub.items?.[0]?.price?.id || ''
          const plan = PLAN_PRICE_IDS[priceId] || ''
          return DOWNLOAD_PLANS.includes(plan)
        })

        if (!hasAccess) {
          return new Response(
            JSON.stringify({ error: 'Kein aktives Handeln- oder Familie-Abo gefunden.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch (e) {
      console.error('[Download] Paddle check failed:', e)
      // Bei Paddle-Fehler: nicht blockieren (Fail open — besser als Nutzer aussperren)
    }
  }

  // 4. Datei aus dem public/vorlagen Ordner holen und ausliefern
  // Cloudflare Pages: statische Assets über fetch erreichbar
  const assetUrl = new URL(`/vorlagen/${safeFile}`, context.request.url).href
  try {
    const assetRes = await fetch(assetUrl)
    if (!assetRes.ok) {
      return new Response('Datei konnte nicht geladen werden.', { status: 500 })
    }

    const blob = await assetRes.arrayBuffer()
    return new Response(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFile}"`,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (e) {
    console.error('[Download] Asset fetch failed:', e)
    return new Response('Download fehlgeschlagen.', { status: 500 })
  }
}

// OPTIONS für CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://www.amtsklar.at',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}
