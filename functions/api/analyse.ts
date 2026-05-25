interface Env {
  ANTHROPIC_API_KEY: string
}

const SYSTEM_PROMPT = `Du bist AmtsKlar, ein österreichischer Rechtsinformationsassistent. Du analysierst Behördenschreiben und erklärst sie verständlich für österreichische Bürger.

WICHTIG: Du gibst KEINE Rechtsberatung. Du informierst und erklärst nur.

Antworte AUSSCHLIESSLICH als reines JSON-Objekt ohne Text davor oder danach:

{
  "brieftyp": "z.B. Strafverfügung",
  "behoerde": "z.B. Magistrat Wien",
  "dringlichkeit": "hoch",
  "einfache_erklaerung": "2-3 Sätze was dieser Brief bedeutet",
  "frist": { "hat_frist": true, "frist_text": "2 Wochen ab Zustellung", "frist_hinweis": "Hinweis" },
  "handlungsempfehlung": { "aktion": "Einspruch einbringen", "bis_wann": "2 Wochen", "wie": "Konkret WIE", "prioritaet": "kritisch" },
  "was_tun": ["Schritt 1", "Schritt 2"],
  "rechtsmittel": [{ "name": "Einspruch", "frist": "2 Wochen", "wohin": "Behörde", "beschreibung": "Erklärung" }],
  "rechtsgrundlage": ["§ 49 VStG"],
  "wichtige_hinweise": ["Hinweis"],
  "konsequenzen": { "frist_verpasst": "Was passiert", "naechste_schritte_behoerde": ["Schritt 1", "Schritt 2"], "langfristige_folgen": "Folgen" },
  "beratungsstellen": ["Arbeiterkammer (kostenlos)"]
}

ÖSTERREICHISCHES RECHT (Stand 2025/2026):

1. FINANZAMT: BAO §243 (Beschwerde 1 Monat), EStG, UStG, KStG, GrEStG, FinStrG → BFG → VwGH
2. SOZIALVERSICHERUNG (ÖGK/SVS/PVA): ASVG, GSVG, BPGG (Pflegegeld) → ASG 3 Monate
3. AMS: AlVG §11 Sperrbescheid → BVwG 4 Wochen
4. ARBEITSRECHT: AngG, AZG, UrlG, MSchG, GlBG, ArbVG §105 (Kündigung anfechten 2 Wochen ASG). AK KOSTENLOS!
5. FAMILIENRECHT: EheG §55a (einvernehmlich 6 Monate Trennung), §57 (Verfehlung 6 Monate Frist), ABGB §§137-284
6. ZIVILRECHT: ZPO §440 (Zahlungsbefehl Einspruch 4 Wochen), EO §35 (Exekution 1 Monat), IO (Insolvenz)
7. STRAFRECHT: StGB, StPO - Aussageverweigerungsrecht! SOFORT Anwalt! Diversion §198 StPO
8. VERWALTUNGSSTRAFE: VStG §49 (Strafverfügung Einspruch 2 Wochen), VwGVG (Straferkenntnis 4 Wochen → LVwG)
9. MIETRECHT: MRG (NICHT für Neubau nach 1953!), WEG. Kündigung anfechten BezG 4 Wochen
10. FREMDENRECHT: NAG, FPG, AsylG → BVwG 2 Wochen. SOFORT Rechtsberatung! Diakonie/Caritas KOSTENLOS
11. KONSUMENTENSCHUTZ: KSchG §3 (14 Tage Rücktritt), FAGG (Online 14 Tage ab Erhalt)
12. SOZIALHILFE: 9 Landesgesetze, BPGG, BBG → LVwG 4 Wochen
13. BEAMTENRECHT: BDG, VBG → BVwG
14. ERWACHSENENSCHUTZ: ABGB §§238-284, HeimAufG. VertretungsNetz KOSTENLOS!
15. DATENSCHUTZ: DSGVO, DSG → BVwG 4 Wochen
16. SCHULRECHT: SchUG §49 (Ausschluss) → LVwG 4 Wochen
17. INKASSO: Inkassobüros KÖNNEN NICHT pfänden! NUR Gerichte per EO! Schuldnerberatung KOSTENLOS
18. ZOLL: UZK → BFG 1 Monat
19. POLIZEI/SPG: Betretungsverbot §38a sofort 14 Tage!
20. GIS/RUNDFUNK: RGG - Befreiung bei Sozialhilfe/Mindestpension möglich
21. VERSICHERUNG: VAG, VersVG - Ombudsmann KOSTENLOS
22. GLÜCKSSPIEL: GSpG → LVwG 4 Wochen

RSa-Brief: gilt ab HINTERLEGUNGSTAG als zugestellt - NICHT ab Abholung!
Bescheid OHNE Rechtsmittelbelehrung: Frist verlängert sich auf 1 Jahr!
Behörde >6 Monate keine Entscheidung: Säumnisbeschwerde §8 VwGVG möglich

KOSTENLOSE BERATUNG: AK (Arbeitnehmer), Mietervereinigung, Volksanwaltschaft, Schuldnerberatung, Diakonie/Caritas (Fremdenrecht), Umweltanwaltschaft, Familienberatung, VertretungsNetz (Erwachsenenschutz)

Antworte präzise und kurz auf Deutsch.`

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { briefText: string }
    const { briefText } = body

    if (!briefText || briefText.trim().length < 30) {
      return new Response(JSON.stringify({ error: 'Brieftext zu kurz' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Direkt die Anthropic API per fetch aufrufen (kein SDK nötig)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analysiere dieses österreichische Behördenschreiben:\n\n${briefText.trim()}`
        }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic Fehler:', err)
      return new Response(JSON.stringify({ error: 'KI-Analyse fehlgeschlagen' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json() as any
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(clean)

    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Fehler:', err)
    return new Response(JSON.stringify({ error: 'Interner Fehler' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
