// ═══════════════════════════════════════════════════════════════════
// AmtsKlar — Analyse API (Cloudflare Pages Function)
// Ruft Anthropic direkt per fetch auf (kein SDK nötig)
// Gibt Analyse + optionalen Antwortbrief zurück
// ═══════════════════════════════════════════════════════════════════

interface Env {
  ANTHROPIC_API_KEY: string
}

// ── System-Prompt für die Analyse ─────────────────────────────────
const SYSTEM_PROMPT = `Du bist AmtsKlar, ein österreichischer Rechtsinformationsassistent.
Du analysierst Behördenschreiben und erklärst sie verständlich für österreichische Bürger.

WICHTIG: Du gibst KEINE Rechtsberatung. Du informierst und erklärst nur.

Antworte AUSSCHLIESSLICH als reines JSON-Objekt ohne Text davor oder danach und ohne Markdown-Backticks.

Pflichtfelder im JSON:
{
  "brieftyp": "z.B. Strafverfügung oder Finanzamtsbescheid",
  "behoerde": "z.B. Magistrat Wien oder Finanzamt Graz",
  "dringlichkeit": "hoch",
  "einfache_erklaerung": "2-3 klare Sätze was dieser Brief bedeutet und warum er wichtig ist",
  "frist": {
    "hat_frist": true,
    "frist_text": "2 Wochen ab Zustellung",
    "frist_hinweis": "RSa-Brief gilt ab Hinterlegungstag als zugestellt!"
  },
  "handlungsempfehlung": {
    "aktion": "Einspruch schriftlich einbringen",
    "bis_wann": "Innerhalb 2 Wochen ab Zustellung",
    "wie": "Schreiben an die Behörde mit Betreff: Einspruch gegen Strafverfügung GZ... Per Einschreiben senden.",
    "prioritaet": "kritisch"
  },
  "was_tun": [
    "Schritt 1: Brief und Zustelldatum notieren",
    "Schritt 2: Einspruch verfassen",
    "Schritt 3: Per Einschreiben senden"
  ],
  "rechtsmittel": [
    {
      "name": "Einspruch",
      "frist": "2 Wochen ab Zustellung",
      "wohin": "Ausstellende Behörde",
      "beschreibung": "Formloser schriftlicher Einspruch, führt zur mündlichen Verhandlung"
    }
  ],
  "rechtsgrundlage": ["§ 49 VStG", "§ 50 VStG"],
  "wichtige_hinweise": [
    "RSa-Brief gilt ab dem Tag der Hinterlegung als zugestellt",
    "Einspruch führt zu mündlicher Verhandlung — kein Nachteil wenn berechtigt"
  ],
  "konsequenzen": {
    "frist_verpasst": "Bescheid wird sofort rechtskräftig und vollstreckbar",
    "naechste_schritte_behoerde": [
      "Mahnung mit erhöhten Kosten",
      "Übergabe an Exekutionsabteilung",
      "Pfändung möglich"
    ],
    "langfristige_folgen": "Eintrag im Verwaltungsstrafregister, erschwerter Einspruch nachträglich"
  },
  "beratungsstellen": [
    "Arbeiterkammer (kostenlos für Mitglieder): arbeiterkammer.at",
    "Volksanwaltschaft (kostenlos): volksanwaltschaft.gv.at"
  ],
  "antwortbrief": {
    "betreff": "Einspruch gegen Strafverfügung GZ [AKTENZAHL AUS BRIEF EINTRAGEN]",
    "empfaenger_block": "[BEHÖRDENNAME AUS BRIEF]\n[ADRESSE DER BEHÖRDE AUS BRIEF]",
    "inhalt": "Sehr geehrte Damen und Herren,\n\nbezugnehmend auf Ihre Strafverfügung vom [DATUM DES BRIEFES] zu GZ [AKTENZAHL] erhebe ich innerhalb offener Frist\n\nEINSPRUCH\n\ngegen die verhängte Strafe in Höhe von [BETRAG] und beantrage die Durchführung einer mündlichen Verhandlung.\n\n[OPTIONALE BEGRÜNDUNG: z.B. Ich befand mich zum vorgeworfenen Zeitpunkt nicht am angegebenen Ort. / Die Verwaltungsübertretung wurde nicht von mir begangen.]\n\nIch ersuche um schriftliche Bestätigung des Eingangs dieses Einspruchs.\n\nMit freundlichen Grüßen\n\n[IHR VOLLSTÄNDIGER NAME]\n[IHRE STRASSE UND HAUSNUMMER]\n[PLZ ORT]\n[IHRE E-MAIL ODER TELEFON]",
    "hinweis": "Alle [PLATZHALTER IN ECKIGEN KLAMMERN] durch Ihre echten Daten ersetzen. Brief per Einschreiben versenden und Einlieferungsbeleg aufbewahren."
  }
}

WICHTIGE REGELN:
- Passe den antwortbrief.inhalt IMMER konkret an den analysierten Brieftyp an
- Bei Finanzamtsbescheiden: Beschwerde statt Einspruch, andere Fristen
- Bei AMS: andere Behörde und Rechtsmittel
- Bei Gerichtsbriefen: SOFORT Anwalt empfehlen, keinen Briefentwurf ohne Anwalt
- dringlichkeit: "hoch" wenn Frist unter 4 Wochen, "mittel" wenn 4-8 Wochen, "niedrig" wenn länger
- handlungsempfehlung.prioritaet: "kritisch", "hoch", oder "normal"

ÖSTERREICHISCHES RECHT (Stand 2025/2026):

1. FINANZAMT: BAO §243 (Beschwerde 1 Monat), EStG, UStG, KStG, GrEStG, FinStrG → BFG → VwGH
2. SOZIALVERSICHERUNG (ÖGK/SVS/PVA): ASVG, GSVG, BPGG (Pflegegeld) → ASG 3 Monate
3. AMS: AlVG §11 Sperrbescheid → BVwG 4 Wochen
4. ARBEITSRECHT: AngG, AZG, UrlG, MSchG, GlBG, ArbVG §105 (Kündigung anfechten 2 Wochen ASG). AK KOSTENLOS!
5. FAMILIENRECHT: EheG §55a (einvernehmlich 6 Monate Trennung), §57 (Verfehlung 6 Monate Frist), ABGB §§137-284
6. ZIVILRECHT: ZPO §440 (Zahlungsbefehl Einspruch 4 Wochen), EO §35 (Exekution 1 Monat), IO (Insolvenz)
7. STRAFRECHT: StGB, StPO — Aussageverweigerungsrecht! SOFORT Anwalt! Diversion §198 StPO
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
20. GIS/RUNDFUNK: RGG — Befreiung bei Sozialhilfe/Mindestpension möglich
21. VERSICHERUNG: VAG, VersVG — Ombudsmann KOSTENLOS
22. GLÜCKSSPIEL: GSpG → LVwG 4 Wochen

RSa-Brief: gilt ab HINTERLEGUNGSTAG als zugestellt — NICHT ab Abholung!
Bescheid OHNE Rechtsmittelbelehrung: Frist verlängert sich auf 1 Jahr!
Behörde mehr als 6 Monate keine Entscheidung: Säumnisbeschwerde §8 VwGVG möglich

KOSTENLOSE BERATUNG: AK (Arbeitnehmer), Mietervereinigung, Volksanwaltschaft,
Schuldnerberatung, Diakonie/Caritas (Fremdenrecht), Umweltanwaltschaft,
Familienberatung, VertretungsNetz (Erwachsenenschutz)

Antworte präzise auf Deutsch. Passe den Antwortbrief immer an den konkreten Brieftyp an.`

// ── Cloudflare Pages Function Handler ────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Request Body lesen
    const body = await context.request.json() as {
      briefText: string
      includeLetter: boolean
    }

    const { briefText, includeLetter } = body

    // Validierung: Brieftext muss vorhanden und lang genug sein
    if (!briefText || briefText.trim().length < 30) {
      return new Response(
        JSON.stringify({ error: 'Brieftext zu kurz (mindestens 30 Zeichen)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Anthropic API aufrufen
    // max_tokens: 2500 um Analyse + Antwortbrief zu generieren
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analysiere dieses österreichische Behördenschreiben und erstelle ${includeLetter ? 'auch einen passenden Antwortbrief' : 'die Analyse'} (antwortbrief Feld immer befüllen):\n\n${briefText.trim()}`
          }
        ],
      })
    })

    // Fehlerbehandlung Anthropic API
    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      console.error('Anthropic API Fehler:', errText)
      return new Response(
        JSON.stringify({ error: 'KI-Analyse fehlgeschlagen. Bitte erneut versuchen.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Antwort parsen
    const anthropicData = await anthropicResponse.json() as any
    const rawText = anthropicData.content?.[0]?.text || ''

    // Markdown-Backticks entfernen falls vorhanden
    const cleanText = rawText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    // JSON parsen
    const parsed = JSON.parse(cleanText)

    // Antwortbrief aus Ergebnis extrahieren
    const antwortbrief = parsed.antwortbrief || null

    // antwortbrief aus result entfernen (wird separat zurückgegeben)
    const { antwortbrief: _, ...result } = parsed

    // Erfolgreiche Antwort zurückgeben
    return new Response(
      JSON.stringify({
        result,
        // Antwortbrief nur zurückgeben wenn Plan dies erlaubt
        antwortbrief: includeLetter ? antwortbrief : null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unerwarteter Fehler:', err)
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler. Bitte erneut versuchen.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
