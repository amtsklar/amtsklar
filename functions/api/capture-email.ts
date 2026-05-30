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

// AmtsKlar — E-Mail Capture Endpoint
// Empfängt E-Mail-Adressen von Nutzern nach der kostenlosen Analyse
// Sendet eine einfache Bestätigungs-E-Mail (benötigt Brevo/Resend API Key)
// SETUP: BREVO_API_KEY als Cloudflare Secret hinterlegen

interface Env {
  BREVO_API_KEY?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://www.amtsklar.at',
    'Content-Type': 'application/json',
  }

  try {
    const body = await context.request.json() as { email?: string; lang?: string }
    const email = body.email?.trim().toLowerCase()
    const lang  = body.lang || 'de'

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), { status: 400, headers: corsHeaders })
    }

    // Wenn kein Brevo-Key: nur loggen (kein Fehler für User)
    if (!context.env.BREVO_API_KEY) {
      console.log(`[EmailCapture] ${email} (lang: ${lang}) — no BREVO_API_KEY set`)
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })
    }

    // Brevo Transactional Email API
    const subjects: Record<string, string> = {
      de: 'Ihr AmtsKlar-Ergebnis + Frist-Erinnerung',
      en: 'Your AmtsKlar result + deadline reminder',
      tr: 'AmtsKlar sonucunuz + son tarih hatırlatması',
    }

    const bodyTexts: Record<string, string> = {
      de: `Vielen Dank für Ihre Analyse mit AmtsKlar.\n\nWir erinnern Sie rechtzeitig an Ihre Frist — damit Sie keine wichtige Deadline verpassen.\n\nSollten Sie noch Fragen haben, antworten Sie einfach auf diese E-Mail.\n\nMit freundlichen Grüßen\nDas AmtsKlar-Team\n\n---\nAmtsKlar | www.amtsklar.at | info@amtsklar.at\nSie erhalten diese E-Mail weil Sie sich auf AmtsKlar registriert haben. Zum Abmelden antworten Sie mit "Abmelden".`,
      en: `Thank you for using AmtsKlar.\n\nWe will remind you of your deadline in time — so you don't miss any important date.\n\nBest regards\nThe AmtsKlar Team`,
      tr: `AmtsKlar kullandığınız için teşekkürler.\n\nSon tarihinizi zamanında hatırlatacağız.\n\nSaygılarımızla\nAmtsKlar Ekibi`,
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': context.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'AmtsKlar', email: 'info@amtsklar.at' },
        to: [{ email }],
        subject: subjects[lang] || subjects.de,
        textContent: bodyTexts[lang] || bodyTexts.de,
        tags: ['email-capture', `lang-${lang}`],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[EmailCapture] Brevo error:', err)
      // Don't fail the user — just log
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })

  } catch (e) {
    console.error('[EmailCapture] Error:', e)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders })
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://www.amtsklar.at',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
