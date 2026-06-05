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
  ANTHROPIC_API_KEY: string
}

const ipUsageMap = new Map<string, { count: number; firstSeen: number }>()
const SERVER_FREE_LIMIT = 1
const RESET_AFTER_MS = 24 * 60 * 60 * 1000

const SYSTEM_PROMPT = `Du bist AmtsKlar, der führende österreichische Rechtsinformationsassistent.
Du analysierst Behördenschreiben, Bescheide, Strafverfügungen und offizielle Schreiben
und erklärst sie verständlich für österreichische Bürger.

WICHTIG: Du gibst KEINE Rechtsberatung. Du informierst und erklärst nur.
Bei strafrechtlichen oder besonders komplexen Fällen immer einen Anwalt empfehlen.

Antworte AUSSCHLIESSLICH als reines JSON ohne Text davor oder danach, keine Backticks:

{
  "brieftyp": "Konkreter Name z.B. Einkommensteuerbescheid 2024",
  "behoerde": "z.B. Finanzamt Wien 2/20/21/22",
  "dringlichkeit": "hoch",
  "einfache_erklaerung": "2-3 klare Sätze in einfacher Sprache",
  "frist": {
    "hat_frist": true,
    "frist_text": "1 Monat ab Zustellung",
    "frist_hinweis": "RSa-Brief: Frist läuft ab Hinterlegungstag!"
  },
  "handlungsempfehlung": {
    "aktion": "Beschwerde beim Bundesfinanzgericht einbringen",
    "bis_wann": "Innerhalb 1 Monat ab Zustellung (§ 243 BAO)",
    "wie": "Schriftlich an das Finanzamt: Ich erhebe Beschwerde gegen den Bescheid vom [DATUM] zu GZ [NUMMER]...",
    "prioritaet": "kritisch"
  },
  "was_tun": ["Schritt 1 konkret", "Schritt 2 konkret"],
  "rechtsmittel": [{
    "name": "Beschwerde",
    "frist": "1 Monat",
    "wohin": "Finanzamt (leitet weiter an BFG)",
    "beschreibung": "Formlose schriftliche Beschwerde mit Begründung"
  }],
  "rechtsgrundlage": ["§ 243 BAO", "§ 260 BAO"],
  "wichtige_hinweise": ["Hinweis 1", "Hinweis 2"],
  "konsequenzen": {
    "frist_verpasst": "Was sofort passiert",
    "naechste_schritte_behoerde": ["Schritt 1", "Schritt 2"],
    "langfristige_folgen": "Langfristige Folgen"
  },
  "beratungsstellen": ["Arbeiterkammer (kostenlos): arbeiterkammer.at"],
  "antwortbrief": {
    "betreff": "Beschwerde gegen Einkommensteuerbescheid 2024 GZ [AKTENZAHL]",
    "empfaenger_block": "[BEHÖRDE UND ADRESSE AUS DEM BRIEF]",
    "inhalt": "Sehr geehrte Damen und Herren,\n\nbezugnehmend auf Ihren Bescheid vom [DATUM] zu GZ [AKTENZAHL] erhebe ich fristgerecht\n\nBESCHWERDE\n\ngegen den angefochtenen Bescheid und beantrage dessen Aufhebung bzw. Abänderung zu meinen Gunsten.\n\nBegründung: [IHRE BEGRÜNDUNG EINFÜGEN]\n\nIch ersuche um schriftliche Bestätigung des Eingangs.\n\nMit freundlichen Grüßen\n\n[IHR VOLLSTÄNDIGER NAME]\n[IHRE ADRESSE]\n[DATUM]",
    "hinweis": "Alle [PLATZHALTER] ersetzen. Einschreiben aufbewahren. Kopie behalten."
  }
}

FRISTEN-GRUNDREGELN:
- RSa-Brief gilt ab HINTERLEGUNGSTAG als zugestellt (NICHT ab Abholung!)
- RSb-Brief gilt ab dem Tag der Übergabe als zugestellt
- Bescheid OHNE Rechtsmittelbelehrung: Frist verlängert sich auf 1 Jahr!
- Behörde >6 Monate keine Entscheidung: Säumnisbeschwerde (§ 8 VwGVG) möglich
- dringlichkeit="hoch" wenn Frist unter 4 Wochen; "mittel" 4-8 Wochen; "niedrig" länger
- prioritaet="kritisch" bei Freiheitsentzug/Abschiebung/Entzug; "hoch" bei Geldstrafe/Kündigung; "normal" sonst

KRITISCH — ERSATZFREIHEITSSTRAFE vs. FAHRVERBOT:
- "Ersatzfreiheitsstrafe von X Tagen" = KEIN Fahrverbot! Das ist Gefängnis NUR falls die Geldstrafe NICHT bezahlt werden kann. In der Erklärung NIEMALS als Fahrverbot bezeichnen!
- Ein echtes Fahrverbot steht explizit als "Fahrverbot" oder "Lenkberechtigungsentzug" im Brief.

INSTANZENWEG ÜBERBLICK:
- Verwaltungssachen: Bescheid → LVwG (4 Wo) → VwGH (6 Wo) → VfGH
- Bundesbehörden: Bescheid → BVwG (4 Wo) → VwGH (6 Wo)
- Finanzrecht: Bescheid → BFG (1 Mo) → VwGH (6 Wo)
- Sozialrecht: Einspruch → Klage ASG (3 Mo) → OLG → OGH
- Verwaltungsstrafrecht: Strafverfügung → Einspruch (2 Wo) → Straferkenntnis → LVwG (4 Wo)

KOSTENLOSE BERATUNG ÖSTERREICH:
- Arbeiterkammer (AK): arbeiterkammer.at
- Mietervereinigung: mietervereinigung.at
- Volksanwaltschaft: volksanwaltschaft.gv.at
- Schuldnerberatung: schuldenberatung.at
- Diakonie/Caritas: Fremdenrecht, Asyl
- Datenschutzbehörde: dsb.gv.at

Passe den antwortbrief.inhalt konkret an den analysierten Brieftyp an.
Für Strafrecht, Asylrecht, und Fremdenrecht: immer sofort Anwalt empfehlen.`

function extractJson(raw: string): string {
  let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const first = text.indexOf('{')
  const last  = text.lastIndexOf('}')
  if (first !== -1 && last > first) return text.substring(first, last + 1)
  return text
}

function validateResult(r: any): any {
  const validDringlichkeit = ['hoch', 'mittel', 'niedrig']
  return {
    brieftyp:            r.brieftyp            || 'Behördenschreiben',
    behoerde:            r.behoerde            || 'Österreichische Behörde',
    dringlichkeit:       validDringlichkeit.includes(r.dringlichkeit) ? r.dringlichkeit : 'mittel',
    einfache_erklaerung: r.einfache_erklaerung || 'Analyse konnte nicht vollständig durchgeführt werden.',
    frist: {
      hat_frist:    r.frist?.hat_frist    ?? false,
      frist_text:   r.frist?.frist_text   || '',
      frist_hinweis: r.frist?.frist_hinweis || '',
    },
    handlungsempfehlung: {
      aktion:     r.handlungsempfehlung?.aktion     || 'Sachverhalt mit Fachkraft klären',
      bis_wann:   r.handlungsempfehlung?.bis_wann   || 'So bald wie möglich',
      wie:        r.handlungsempfehlung?.wie        || '',
      prioritaet: r.handlungsempfehlung?.prioritaet || 'normal',
    },
    was_tun:           Array.isArray(r.was_tun)           ? r.was_tun           : [],
    rechtsmittel:      Array.isArray(r.rechtsmittel)      ? r.rechtsmittel      : [],
    rechtsgrundlage:   Array.isArray(r.rechtsgrundlage)   ? r.rechtsgrundlage   : [],
    wichtige_hinweise: Array.isArray(r.wichtige_hinweise) ? r.wichtige_hinweise : [],
    konsequenzen: {
      frist_verpasst:             r.konsequenzen?.frist_verpasst             || '',
      naechste_schritte_behoerde: Array.isArray(r.konsequenzen?.naechste_schritte_behoerde) ? r.konsequenzen.naechste_schritte_behoerde : [],
      langfristige_folgen:        r.konsequenzen?.langfristige_folgen        || '',
    },
    beratungsstellen: Array.isArray(r.beratungsstellen) ? r.beratungsstellen : [],
  }
}

function parseApiResponse(rawText: string): { result: any; antwortbrief: any } {
  try {
    const json = extractJson(rawText)
    const parsed = JSON.parse(json)
    const antwortbrief = parsed.antwortbrief || null
    const result = { ...parsed }
    delete result.antwortbrief
    return { result, antwortbrief }
  } catch (_) { /* fallback */ }

  try {
    let text = extractJson(rawText)
    const letterKey = text.lastIndexOf('"antwortbrief"')
    if (letterKey > 0) {
      let truncated = text.substring(0, letterKey)
      truncated = truncated.replace(/,\s*$/, '') + '}'
      const parsed = JSON.parse(truncated)
      return { result: parsed, antwortbrief: null }
    }
  } catch (_) { /* fallback */ }

  return {
    result: {
      brieftyp: 'Behördenschreiben',
      behoerde: 'Österreichische Behörde',
      dringlichkeit: 'mittel',
      einfache_erklaerung: 'Die automatische Analyse konnte den Brief nicht vollständig verarbeiten. Bitte wende dich an die Arbeiterkammer oder einen Anwalt.',
      frist: { hat_frist: false, frist_text: '', frist_hinweis: 'Fristen bitte manuell prüfen!' },
      handlungsempfehlung: { aktion: 'Fachkraft kontaktieren', bis_wann: 'So bald wie möglich', wie: 'Arbeiterkammer (kostenlos): arbeiterkammer.at', prioritaet: 'hoch' },
      was_tun: ['Brief sorgfältig durchlesen', 'Datum der Zustellung notieren', 'Arbeiterkammer oder Anwalt kontaktieren'],
      rechtsmittel: [],
      rechtsgrundlage: [],
      wichtige_hinweise: ['Analyse war nicht vollständig erfolgreich — bitte Fachkraft konsultieren'],
      konsequenzen: { frist_verpasst: '', naechste_schritte_behoerde: [], langfristige_folgen: '' },
      beratungsstellen: ['Arbeiterkammer (kostenlos): arbeiterkammer.at', 'Volksanwaltschaft: volksanwaltschaft.gv.at'],
    },
    antwortbrief: null,
  }
}

const LANG_NAMES: Record<string, string> = {
  de:'Deutsch', en:'English', tr:'Türkçe', sr:'Srpski',
  hr:'Hrvatski', hu:'Magyar', sl:'Slovenščina', sk:'Slovenčina',
  ro:'Română', pl:'Polski', ru:'Русский', it:'Italiano',
}

async function callAnthropic(
  input: { briefText?: string; briefImage?: { data: string; mediaType: string } },
  includeLetter: boolean,
  apiKey: string,
  language = 'de'
): Promise<string> {

  const langName = LANG_NAMES[language] || 'Deutsch'
  const langPrefix = language !== 'de'
    ? `CRITICAL LANGUAGE INSTRUCTION: You MUST respond in ${langName} for ALL explanatory fields: einfache_erklaerung, handlungsempfehlung.aktion, handlungsempfehlung.bis_wann, handlungsempfehlung.wie, was_tun, rechtsmittel descriptions, wichtige_hinweise, konsequenzen, beratungsstellen.\n\nEXCEPTION - ALWAYS IN GERMAN: The fields antwortbrief.inhalt, antwortbrief.betreff, antwortbrief.empfaenger_block MUST ALWAYS be written in German because they are sent to Austrian authorities.\n\nSo: explanations = ${langName}, reply letter content = ALWAYS German.\n\n`
    : ''
  const langSuffix = language !== 'de'
    ? `\n\nREMINDER: Explanations in ${langName}. BUT antwortbrief.inhalt/betreff/empfaenger_block ALWAYS in German.`
    : ''
  const systemPromptWithLang = langPrefix + SYSTEM_PROMPT + langSuffix

  let userContent: any

  if (input.briefImage) {
    userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: input.briefImage.mediaType,
          data: input.briefImage.data,
        },
      },
      {
        type: 'text',
        text: `Analysiere dieses österreichische Behördenschreiben. Das Bild zeigt ein Foto oder einen Scan eines Briefes/Bescheides. Bitte lies den gesamten sichtbaren Text im Bild und analysiere ihn vollständig.${includeLetter ? ' Erstelle auch einen passenden Antwortbrief im antwortbrief-Feld.' : ' Das antwortbrief-Feld kann leer bleiben.'}`,
      },
    ]
  } else {
    const raw = (input.briefText || '').trim()
    const text = raw.length > 8000
      ? raw.substring(0, 8000) + '\n\n[Hinweis: Text wurde auf 8000 Zeichen gekürzt]'
      : raw
    userContent = `Analysiere dieses österreichische Behördenschreiben${
      includeLetter
        ? ' und erstelle einen passenden Antwortbrief im antwortbrief-Feld'
        : ' (antwortbrief-Feld kann leer bleiben)'
    }.\n\nBrieftext:\n${text}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 28000)

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: systemPromptWithLang,
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    })
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('TIMEOUT: Die Analyse hat zu lange gedauert. Bitte versuche es nochmal.')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API ${response.status}: ${err.substring(0, 200)}`)
  }

  const data = await response.json() as any
  return data.content?.[0]?.text || ''
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      briefText?:  string
      briefImage?: { data: string; mediaType: string }
      includeLetter?: boolean
      language?: string
      isPaid?: boolean
    }

    const includeLetter = body.includeLetter ?? false
    const isPaidRequest = body.isPaid === true
    const language      = body.language || 'de'
    const hasBriefText  = typeof body.briefText === 'string' && (body.briefText as string).trim().length >= 20
    const hasBriefImage = body.briefImage != null && !!(body.briefImage as any).data && !!(body.briefImage as any).mediaType

    if (hasBriefText && body.briefText!.length > 20000) {
      return new Response(
        JSON.stringify({ error: 'Text zu lang (max. 20.000 Zeichen). Bitte kürzen.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (hasBriefImage && body.briefImage!.data.length > 35_000_000) {
      return new Response(
        JSON.stringify({ error: 'Bild zu groß. Bitte unter 25 MB.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!isPaidRequest) {
      const clientIp = context.request.headers.get('CF-Connecting-IP')
        || context.request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
        || 'unknown'

      const now = Date.now()
      const ipData = ipUsageMap.get(clientIp)

      if (ipData && (now - ipData.firstSeen) > RESET_AFTER_MS) {
        ipUsageMap.delete(clientIp)
      }

      const currentCount = ipUsageMap.get(clientIp)?.count || 0

      if (currentCount >= SERVER_FREE_LIMIT) {
        return new Response(
          JSON.stringify({ error: 'Kostenlose Analyse bereits genutzt. Bitte Paket wählen um fortzufahren.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      ipUsageMap.set(clientIp, {
        count: currentCount + 1,
        firstSeen: ipData?.firstSeen || now,
      })
    }

    if (!hasBriefText && !hasBriefImage) {
      return new Response(
        JSON.stringify({ error: 'Bitte Brieftext einfügen oder Foto/PDF hochladen.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const input = hasBriefImage
      ? { briefImage: body.briefImage }
      : { briefText: body.briefText }

    const rawApiResponse = await callAnthropic(input, includeLetter, context.env.ANTHROPIC_API_KEY, language)
    const { result: rawResult, antwortbrief } = parseApiResponse(rawApiResponse)
    const result = validateResult(rawResult)

    return new Response(
      JSON.stringify({
        result,
        antwortbrief: includeLetter ? antwortbrief : null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('AmtsKlar Analyse-Fehler:', err?.message || err)
    return new Response(
      JSON.stringify({ error: 'Analyse fehlgeschlagen. Bitte erneut versuchen.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
