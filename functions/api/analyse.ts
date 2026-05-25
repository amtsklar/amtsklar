interface Env { ANTHROPIC_API_KEY: string }

const SYSTEM = `Du bist AmtsKlar, ein österreichischer Rechtsinformationsassistent. Du analysierst Behördenschreiben und erklärst sie verständlich für österreichische Bürger. WICHTIG: Du gibst KEINE Rechtsberatung.

Antworte AUSSCHLIESSLICH als reines JSON-Objekt:
{
  "brieftyp": "z.B. Strafverfügung",
  "behoerde": "z.B. Magistrat Wien",
  "dringlichkeit": "hoch",
  "einfache_erklaerung": "2-3 Sätze",
  "frist": { "hat_frist": true, "frist_text": "2 Wochen ab Zustellung", "frist_hinweis": "Hinweis" },
  "handlungsempfehlung": { "aktion": "Einspruch einbringen", "bis_wann": "2 Wochen", "wie": "Konkret WIE", "prioritaet": "kritisch" },
  "was_tun": ["Schritt 1", "Schritt 2"],
  "rechtsmittel": [{ "name": "Einspruch", "frist": "2 Wochen", "wohin": "Behörde", "beschreibung": "Erklärung" }],
  "rechtsgrundlage": ["§ 49 VStG"],
  "wichtige_hinweise": ["Hinweis"],
  "konsequenzen": { "frist_verpasst": "Was passiert", "naechste_schritte_behoerde": ["Schritt"], "langfristige_folgen": "Folgen" },
  "beratungsstellen": ["Arbeiterkammer (kostenlos)"]
}

ÖSTERREICHISCHES RECHT: Finanzamt (BAO §243, 1 Monat), SV/ÖGK (ASVG, ASG 3 Monate), AMS (AlVG §11, BVwG 4 Wochen), Arbeitsrecht (AngG, AK KOSTENLOS), Zivilrecht (ZPO §440, 4 Wochen), Strafrecht (StGB/StPO - SOFORT Anwalt), Verwaltungsstrafe (VStG §49, 2 Wochen), Mietrecht (MRG, BezG 4 Wochen), Fremdenrecht (NAG/FPG - SOFORT Rechtsberatung), Inkasso (NUR Gerichte können pfänden - Schuldnerberatung KOSTENLOS).
RSa-Brief: gilt ab HINTERLEGUNGSTAG. Bescheid OHNE Rechtsmittelbelehrung: 1 Jahr Frist.`

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { briefText: string }
    const { briefText } = body

    if (!briefText || briefText.trim().length < 30) {
      return new Response(JSON.stringify({ error: 'Brieftext zu kurz' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Analysiere dieses österreichische Behördenschreiben:\n\n${briefText.trim()}` }]
      })
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'KI-Analyse fehlgeschlagen' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const data = await response.json() as any
    const text = data.content?.[0]?.text || ''

    // Robustes JSON-Parsing
    let result
    try {
      const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      result = JSON.parse(clean)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) result = JSON.parse(match[0])
      else throw new Error('Kein JSON gefunden')
    }

    return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Fehler:', err)
    return new Response(JSON.stringify({ error: 'Analyse fehlgeschlagen. Bitte erneut versuchen.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
