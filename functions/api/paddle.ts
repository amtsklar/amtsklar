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

// AmtsKlar — Paddle Webhook Handler + Brevo E-Mail
// Events: subscription.created, subscription.activated, subscription.canceled, etc.

interface Env {
  PADDLE_WEBHOOK_SECRET: string
  BREVO_API_KEY: string
}

// ── Paddle HMAC Signature verifizieren ────────────────────────────
async function verifyPaddleSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(';')
    const tsPart = parts.find(p => p.startsWith('ts='))
    const h1Part = parts.find(p => p.startsWith('h1='))
    if (!tsPart || !h1Part) return false

    const ts   = tsPart.split('=')[1]
    const hash = h1Part.split('=')[1]

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

// ── Plan aus Paddle-Preisen ableiten ──────────────────────────────
function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    'pri_01ksft9sb5nbptry9pyyd6q54y': 'Verstehen',
    'pri_01kspy294ejb2cye55ahj4ypj1': 'Verstehen',
    'pri_01ksftcj51p1jsmjk2pr0jbcat': 'Handeln',
    'pri_01kspy5h321a355ngn0qhjn5m4': 'Handeln',
    'pri_01ksftg5nw1a2nztra644zhd5a': 'Familie',
    'pri_01kspy9q00s8k4v4hsw6j3trmr': 'Familie',
  }
  return map[priceId] || 'Verstehen'
}

// ── Brevo E-Mail senden ───────────────────────────────────────────
async function sendWelcomeEmail(
  email: string,
  plan: string,
  apiKey: string
): Promise<void> {
  const planFeatures: Record<string, string[]> = {
    'Verstehen': [
      '✓ Unbegrenzte Analysen',
      '✓ 82 Rechtsbereiche',
      '✓ Fristenerkennung',
      '✓ 12 Sprachen',
    ],
    'Handeln': [
      '✓ Alle Verstehen-Features',
      '✓ Automatischer Antwortbrief',
      '✓ Mustervorlagen',
    ],
    'Familie': [
      '✓ Alle Handeln-Features',
      '✓ Bis zu 5 Familienmitglieder',
      '✓ Prioritäts-Support',
    ],
  }

  const features = planFeatures[plan] || planFeatures['Verstehen']

  const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#EEF4FB;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF4FB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #C5D8ED;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F2440,#1A3A5C);padding:32px 40px;text-align:center;">
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFFFF;">
                <span style="font-weight:400;">Amts</span><span style="color:#D4A84B;">Klar</span>
              </div>
              <div style="font-size:11px;color:#90A8C0;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">
                Österreich · Behördenbriefe sofort verstehen
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;color:#0F2440;margin:0 0 16px;">
                Willkommen bei AmtsKlar! 🎉
              </h1>
              <p style="font-size:15px;color:#2A5080;line-height:1.7;margin:0 0 24px;">
                Vielen Dank für Ihr Vertrauen. Ihr <strong>${plan}</strong>-Paket ist jetzt aktiv
                und Sie können sofort loslegen.
              </p>

              <!-- Plan Box -->
              <div style="background:#F5F8FC;border:1px solid #C5D8ED;border-radius:12px;padding:20px;margin-bottom:28px;">
                <div style="font-size:12px;font-weight:600;color:#6A8AAA;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
                  Ihr Paket: ${plan}
                </div>
                ${features.map(f => `
                <div style="font-size:14px;color:#1A3A5C;margin-bottom:8px;">${f}</div>
                `).join('')}
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="https://amtsklar.at/analyse"
                   style="display:inline-block;background:linear-gradient(135deg,#B8832A,#D4A84B);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;">
                  Jetzt Brief analysieren →
                </a>
              </div>

              <!-- How it works -->
              <div style="border-top:1px solid #C5D8ED;padding-top:24px;">
                <p style="font-size:14px;font-weight:600;color:#0F2440;margin:0 0 12px;">
                  So funktioniert es:
                </p>
                <div style="font-size:14px;color:#2A5080;line-height:1.7;">
                  <div style="margin-bottom:8px;">📄 <strong>1.</strong> Brief fotografieren oder Text einfügen</div>
                  <div style="margin-bottom:8px;">🔍 <strong>2.</strong> KI analysiert und erklärt den Inhalt</div>
                  <div style="margin-bottom:8px;">✉️ <strong>3.</strong> Antwortbrief in Minuten fertig</div>
                </div>
              </div>

              <p style="font-size:13px;color:#6A8AAA;margin-top:24px;line-height:1.6;">
                Bei Fragen antworten Sie einfach auf diese E-Mail oder schreiben Sie an
                <a href="mailto:info@amtsklar.at" style="color:#C9963A;">info@amtsklar.at</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F8FC;border-top:1px solid #C5D8ED;padding:20px 40px;text-align:center;">
              <div style="font-size:12px;color:#6A8AAA;line-height:1.6;">
                © 2026 AmtsKlar · STAR:HORIZON LTD · Manchester, England<br>
                <a href="https://amtsklar.at/agb" style="color:#6A8AAA;">AGB</a> ·
                <a href="https://amtsklar.at/datenschutz" style="color:#6A8AAA;">Datenschutz</a> ·
                <a href="https://amtsklar.at/widerruf" style="color:#6A8AAA;">Widerruf</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: 'AmtsKlar',
        email: 'info@amtsklar.at',
      },
      to: [{ email }],
      subject: `✅ Ihr AmtsKlar ${plan}-Paket ist aktiv`,
      htmlContent,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[Brevo] Fehler:', err)
    throw new Error(`Brevo error: ${err}`)
  }

  console.log(`[Brevo] ✅ Willkommens-E-Mail gesendet an: ${email}`)
}

// ── Haupthandler ──────────────────────────────────────────────────
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

    const event   = JSON.parse(body)
    const type    = event.event_type as string
    const data    = event.data || {}
    const email   = data.customer?.email || data.address?.email || ''
    const priceId = data.items?.[0]?.price?.id || ''
    const plan    = planFromPriceId(priceId)
    const subId   = data.id || ''

    console.log(`[Paddle] ${type} | ${email} | ${plan} | sub:${subId}`)

    switch (type) {

      case 'subscription.created':
      case 'subscription.activated':
        console.log(`✅ Abo aktiviert: ${email} → ${plan}`)
        // Willkommens-E-Mail via Brevo senden
        if (email && context.env.BREVO_API_KEY) {
          await sendWelcomeEmail(email, plan, context.env.BREVO_API_KEY)
        }
        break

      case 'subscription.updated':
        console.log(`🔄 Abo geändert: ${email} → ${plan}`)
        break

      case 'subscription.canceled':
        console.log(`❌ Abo gekündigt: ${email}`)
        break

      case 'subscription.past_due':
        console.log(`⚠️ Zahlung fehlgeschlagen: ${email}`)
        break

      case 'subscription.paused':
        console.log(`⏸️ Abo pausiert: ${email}`)
        break

      case 'transaction.completed':
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
