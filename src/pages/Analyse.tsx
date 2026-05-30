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

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLang } from '../i18n/LangContext'
import { calcDeadlineDate, formatDeadline, daysLeftLabel, googleCalendarLink } from '../utils/deadlineCalc'

// PDF.js wird NUR bei Bedarf dynamisch von CDN geladen
// → kein Build-Problem, kein npm-Paket nötig
let pdfJsLoaded = false

async function loadPdfJs(): Promise<any> {
  // Bereits geladen → direkt zurückgeben
  if (pdfJsLoaded && (window as any).pdfjsLib) {
    return (window as any).pdfjsLib
  }

  return new Promise<any>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      const lib = (window as any).pdfjsLib
      if (!lib) { reject(new Error('PDF.js nicht verfügbar')); return }
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfJsLoaded = true
      resolve(lib)
    }
    script.onerror = () => reject(new Error('PDF.js konnte nicht geladen werden'))
    document.head.appendChild(script)
  })
}

// ═══════════════════════════════════════════════════════════════════
// AmtsKlar — Analyse-Seite
// Zeigt Brief-Analyse + Antwortbrief (für Handeln & Familie)
// Verwaltet Paket-Zugang und Paywall
// ═══════════════════════════════════════════════════════════════════

// ── TypeScript Interfaces ─────────────────────────────────────────

interface AnalyseResult {
  brieftyp: string
  behoerde: string
  dringlichkeit: 'hoch' | 'mittel' | 'niedrig'
  einfache_erklaerung: string
  frist: {
    hat_frist: boolean
    frist_text: string
    frist_hinweis?: string
  }
  handlungsempfehlung: {
    aktion: string
    bis_wann: string
    wie: string
    prioritaet: string
  }
  was_tun: string[]
  rechtsmittel: {
    name: string
    frist: string
    wohin: string
    beschreibung: string
  }[]
  rechtsgrundlage: string[]
  wichtige_hinweise: string[]
  konsequenzen: {
    frist_verpasst: string
    naechste_schritte_behoerde: string[]
    langfristige_folgen: string
  }
  beratungsstellen: string[]
}

interface AntwortBrief {
  betreff: string
  empfaenger_block: string
  inhalt: string
  hinweis: string
}

// Paket-Typ
type Plan = 'none' | 'verstehen' | 'handeln' | 'familie'

// ── Konstanten ────────────────────────────────────────────────────

// Dringlichkeits-Farben und Labels
const URGENCY = {
  hoch: {
    color: '#E05252',
    bg: 'rgba(224,82,82,0.08)',
    border: 'rgba(224,82,82,0.25)',
    labelKey: 'urg_dringend' as const,
    icon: '⚠️',
  },
  mittel: {
    color: '#D4943A',
    bg: 'rgba(212,148,58,0.08)',
    border: 'rgba(212,148,58,0.25)',
    labelKey: 'urg_mittel' as const,
    icon: '⏰',
  },
  niedrig: {
    color: '#4CAF82',
    bg: 'rgba(76,175,130,0.08)',
    border: 'rgba(76,175,130,0.25)',
    labelKey: 'urg_keine' as const,
    icon: '✓',
  },
}

// Anzahl kostenloser Analysen
const FREE_LIMIT = 1

// ── Cookie Helpers ────────────────────────────────────────────────
function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

// ── Browser Fingerprint (pseudo-eindeutige Geräte-ID) ─────────────
// Kombination aus Sprache, Auflösung, Zeitzone, Hardware-Threads
// Kein 100% Schutz, aber macht Missbrauch deutlich schwerer
function getFingerprint(): string {
  const parts = [
    navigator.language || '',
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency || 0),
    navigator.platform || '',
  ].join('|')
  let hash = 0
  for (let i = 0; i < parts.length; i++) {
    hash = Math.imul(31, hash) + parts.charCodeAt(i) | 0
  }
  return Math.abs(hash).toString(36)
}

// ── Freikontingent: Alle 3 Schichten prüfen ───────────────────────
function isFreeLimitReached(count: number): boolean {
  if (count >= FREE_LIMIT) return true           // Schicht 1: localStorage Zähler
  if (getCookie('ak_free_done') === '1') return true  // Schicht 2: Cookie (90 Tage)
  const fp = getFingerprint()
  if (localStorage.getItem(`ak_fp_${fp}`) === '1') return true  // Schicht 3: Fingerprint
  return false
}

// ── Alle 3 Schichten als "verbraucht" markieren ───────────────────
function markFreeUsed(newCount: number) {
  localStorage.setItem('ak_count', String(newCount))
  setCookie('ak_free_done', '1', 90)
  const fp = getFingerprint()
  localStorage.setItem(`ak_fp_${fp}`, '1')
}

// Zeichenlimit für Texteingabe
const CHAR_LIMIT   = 8000  // Ab hier wird Text gekürzt
const CHAR_WARN    = 6000  // Ab hier gelbe Warnung
const CHAR_DANGER  = 7500  // Ab hier rote Warnung

// LocalStorage Keys
const SK = {
  count:        'ak_count',        // Anzahl bisheriger Analysen
  paid:         'ak_paid',         // boolean: hat bezahlt
  plan:         'ak_plan',         // 'verstehen' | 'handeln' | 'familie'
  email:        'ak_email',        // E-Mail des Abonnenten
  history:      'ak_history',      // letzte 5 Analyse-Kurzinfos
  savedResult:  'ak_saved_result', // letztes vollständiges Analyse-Ergebnis
  savedBrief:   'ak_saved_brief',  // letzter vollständiger Antwortbrief
}

// Vollständige Analyse speichern (für Upgrade-Flow)
function saveFullResult(result: any, antwortbrief: any) {
  try {
    const payload = { result, antwortbrief, savedAt: Date.now() }
    localStorage.setItem(SK.savedResult, JSON.stringify(payload))
  } catch { /* ignore - localStorage voll */ }
}

// Gespeicherte Analyse laden (nach Upgrade)
function loadSavedResult(): { result: any; antwortbrief: any; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(SK.savedResult)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Nur Ergebnisse der letzten 2 Stunden wiederherstellen
    const TWO_HOURS = 2 * 60 * 60 * 1000
    if (Date.now() - parsed.savedAt > TWO_HOURS) return null
    return parsed
  } catch { return null }
}

// Analyse in History speichern (Kurzinfo für Sidebar)
function saveToHistory(result: any, brieftyp: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(SK.history) || '[]')
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('de-AT'),
      brieftyp: brieftyp || result.brieftyp || 'Analyse',
      dringlichkeit: result.dringlichkeit || 'mittel',
      kurzfassung: (result.einfache_erklaerung || '').slice(0, 120),
    }
    const updated = [entry, ...existing].slice(0, 5)
    localStorage.setItem(SK.history, JSON.stringify(updated))
  } catch { /* ignore */ }
}

// Paddle Preis-IDs je Paket (aus .env)
const PADDLE_PRICES_MONTHLY: Record<string, string> = {
  verstehen: import.meta.env.VITE_PADDLE_PRICE_VERSTEHEN || '',
  handeln:   import.meta.env.VITE_PADDLE_PRICE_HANDELN   || '',
  familie:   import.meta.env.VITE_PADDLE_PRICE_FAMILIE   || '',
}
const PADDLE_PRICES_YEARLY: Record<string, string> = {
  verstehen: 'pri_01kspy294ejb2cye55ahj4ypj1',
  handeln:   'pri_01kspy5h321a355ngn0qhjn5m4',
  familie:   'pri_01kspy9q00s8k4v4hsw6j3trmr',
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

// RIS-Link für Gesetze
function getRISUrl(law: string): string {
  const abbr = law.replace(/§+[\d\s\w,().-]*/g, '').trim().split(/\s+/)[0]
  const known: Record<string, string> = {
    BAO: '10003940', EStG: '10004570', UStG: '10004873',
    ASVG: '10008147', AlVG: '10008227', AVG: '10005768',
    VStG: '10005770', StGB: '10002296', ZPO: '10001699',
    ABGB: '10001622', MRG: '10004895', EheG: '10002814',
    ArbVG: '10008068', AngG: '10003655',
  }
  if (known[abbr]) {
    return `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${known[abbr]}`
  }
  return `https://www.ris.bka.gv.at/Ergebnis.wxe?Abfrage=Bundesnormen&Titel=${encodeURIComponent(abbr)}&Ladtyp=Titel`
}

// Hat der Plan Zugang zum Antwortbrief?
function planHatBrief(plan: Plan): boolean {
  return plan === 'handeln' || plan === 'familie'
}

// ── Text aus PDF extrahieren ──────────────────────────────────────
async function extractTextFromPdf(file: File): Promise<string> {
  // PDF.js dynamisch laden (CDN, nur beim ersten Aufruf)
  const arrayBuffer = await file.arrayBuffer()
  const lib = await loadPdfJs()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise

  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    let lastY: number | null = null
    let pageText = ''

    for (const item of textContent.items as any[]) {
      if (item.str.trim() === '') continue
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += '\n'
      } else if (lastY !== null) {
        pageText += ' '
      }
      pageText += item.str
      lastY = item.transform[5]
    }

    pageTexts.push(pageText.trim())
  }

  return pageTexts.filter(t => t.length > 0).join('\n\n')
}

// ── Bild komprimieren (Canvas API) ───────────────────────────────
// Verhindert zu große Base64-Daten für die API
// Gibt immer JPEG zurück — breite Kompatibilität, gute Kompression
async function compressImage(file: File): Promise<{
  base64:    string
  mediaType: string
  preview:   string
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Max 1920px — ausreichend für Textlesbarkeit durch KI
        const MAX = 1920
        let { width, height } = img

        if (width > MAX || height > MAX) {
          if (width >= height) {
            height = Math.round((height * MAX) / width)
            width  = MAX
          } else {
            width  = Math.round((width * MAX) / height)
            height = MAX
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        // Weißer Hintergrund (wichtig für transparente PNGs)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // JPEG mit guter Qualität — typischerweise 200–600 KB nach Kompression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
        const base64  = dataUrl.split(',')[1]

        resolve({ base64, mediaType: 'image/jpeg', preview: dataUrl })
      }

      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

// ── Logo Komponente ───────────────────────────────────────────────
const Logo = () => {
  const { t } = useLang()
  return (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <defs>
        <linearGradient id="analyseLogoGrad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A84B"/>
          <stop offset="100%" stopColor="#A8731E"/>
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="8" fill="url(#analyseLogoGrad)"/>
      <text x="17" y="24" fontFamily="Georgia,serif" fontSize="19" fontWeight="bold" fill="white" textAnchor="middle">§</text>
    </svg>
    <div>
      <div style={{ fontFamily: 'Libre Baskerville,Georgia,serif', fontSize: 19, fontWeight: 700, lineHeight: 1 }}>
        <span style={{ color: '#0F2440', fontWeight: 400 }}>Amts</span>
        <span style={{ color: '#C9963A', fontWeight: 700 }}>Klar</span>
      </div>
      <div style={{ fontSize: 9, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '0.8px' }} className="logo-sub">
        {t.logo_sub}
      </div>
    </div>
  </Link>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────
export default function Analyse() {

  // State: Formulardaten
  const [briefText, setBriefText] = useState('')

  // State: Ergebnisse
  const [result, setResult]           = useState<AnalyseResult | null>(null)
  const [antwortbrief, setAntwortbrief] = useState<AntwortBrief | null>(null)

  // State: UI
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [screen, setScreen]           = useState<'input' | 'result'>('input')
  const [copied, setCopied]           = useState(false)

  // State: Zugang & Bezahlung
  const [count, setCount]             = useState(0)
  const [isPaid, setIsPaid]           = useState(false)
  const [plan, setPlan]               = useState<Plan>('none')
  const [showPaywall, setShowPaywall] = useState(false)
  const [yearlyBilling, setYearlyBilling] = useState(false)

  // State: E-Mail Capture (nach kostenloser Analyse)
  const [showEmailCapture, setShowEmailCapture] = useState(false)
  const [captureEmail, setCaptureEmail]         = useState('')
  const [captureSubmitted, setCaptureSubmitted] = useState(false)

  // State: Analyse-History
  const [history, setHistory] = useState<{id:number;date:string;brieftyp:string;dringlichkeit:string;kurzfassung:string}[]>([])

  // Sprache aus globalem Context
  const { lang, t } = useLang()

  // State: E-Mail Verifikation
  const [email, setEmail]             = useState('')
  const [verifying, setVerifying]     = useState(false)

  // State: Paddle
  const [paddleReady, setPaddleReady] = useState(false)

  // State: PDF Drag & Drop
  const [isDragOver, setIsDragOver]   = useState(false)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [imageData, setImageData]     = useState<{ base64: string; mediaType: string; preview: string; fileName: string } | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // State: Lange Texte / Kürzungswarnung
  const [wasTruncated, setWasTruncated]           = useState(false)
  const [showLongTextWarning, setShowLongTextWarning] = useState(false)

  // ── Initialisierung beim Start ──────────────────────────────────
  useEffect(() => {
    // Gespeicherten Status aus LocalStorage laden
    const savedCount = parseInt(localStorage.getItem(SK.count) || '0')
    const savedPaid  = localStorage.getItem(SK.paid) === 'true'
    const savedPlan  = (localStorage.getItem(SK.plan) || 'none') as Plan
    const savedEmail = localStorage.getItem(SK.email) || ''

    // Cookie oder Fingerprint vorhanden → Zähler auf FREE_LIMIT setzen
    // (auch wenn localStorage gelöscht wurde)
    const effectiveCount = isFreeLimitReached(savedCount) && !savedPaid
      ? Math.max(savedCount, FREE_LIMIT)
      : savedCount

    setCount(effectiveCount)
    setIsPaid(savedPaid)
    setPlan(savedPlan)
    setEmail(savedEmail)

    // History laden
    try {
      const savedHistory = JSON.parse(localStorage.getItem(SK.history) || '[]')
      setHistory(savedHistory)
    } catch { /* ignore */ }

    // Paddle.js dynamisch laden
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.onload = () => {
      const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
      if (token && (window as any).Paddle) {
        ;(window as any).Paddle.Initialize({ token })
        setPaddleReady(true)
      }
    }
    document.head.appendChild(script)

    // Nach erfolgreicher Paddle-Zahlung: Plan aus URL lesen
    // HashRouter: params sind im hash (#/analyse?success=1&plan=handeln)
    const hashSearch = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : window.location.search
    const params = new URLSearchParams(hashSearch)
    if (params.get('success') === '1') {
      const urlPlan = (params.get('plan') || 'verstehen') as Plan
      localStorage.setItem(SK.paid, 'true')
      localStorage.setItem(SK.plan, urlPlan)
      setIsPaid(true)
      setPlan(urlPlan)
      setShowPaywall(false)
      // URL bereinigen
      window.history.replaceState({}, '', '/analyse')

      // Gespeicherte Analyse wiederherstellen
      const saved = loadSavedResult()
      if (saved?.result) {
        setResult(saved.result)
        setAntwortbrief(saved.antwortbrief || null)
        setScreen('result')
      }
    }

    // Aufräumen beim Unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // ── Paddle Checkout öffnen ──────────────────────────────────────
  const openCheckout = (selectedPlan: 'verstehen' | 'handeln' | 'familie') => {
    const prices = yearlyBilling ? PADDLE_PRICES_YEARLY : PADDLE_PRICES_MONTHLY
    const priceId = prices[selectedPlan]

    // Paddle bereit und Price ID vorhanden → Checkout öffnen
    if (paddleReady && (window as any).Paddle && priceId) {
      ;(window as any).Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: email ? { email } : undefined,
        successUrl: `${window.location.origin}/#/analyse?success=1&plan=${selectedPlan}`,
      })
      return
    }

    // Paddle noch nicht konfiguriert → Hinweis anzeigen statt wegzuleiten
    if (!priceId) {
      setError(t.err_payment)
      setShowPaywall(false)
      return
    }

    // Paddle.js noch nicht geladen → kurz warten und nochmal versuchen
    setError(t.err_payment)
  }

  // ── Subscription per E-Mail prüfen ─────────────────────────────
  const verifySubscription = async () => {
    if (!email.includes('@')) {
      setError(t.err_email)
      return
    }

    setVerifying(true)
    setError(null)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.active) {
        // Standard-Plan bei E-Mail-Verifikation: handeln
        const verifiedPlan: Plan = (data.plan as Plan) || 'handeln'
        localStorage.setItem(SK.paid, 'true')
        localStorage.setItem(SK.plan, verifiedPlan)
        localStorage.setItem(SK.email, email)
        setIsPaid(true)
        setPlan(verifiedPlan)
        setShowPaywall(false)

        // Gespeicherte Analyse wiederherstellen — User muss nicht neu analysieren!
        const saved = loadSavedResult()
        if (saved?.result) {
          setResult(saved.result)
          setAntwortbrief(saved.antwortbrief || null)
          setScreen('result')
        }
      } else {
        setError(t.err_verify)
      }
    } catch {
      setError(t.err_verify)
    } finally {
      setVerifying(false)
    }
  }

  // ── PDF Datei verarbeiten ───────────────────────────────────────
  const processPdfFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Bitte nur PDF-Dateien hochladen (z.B. Ihr gespeicherter Bescheid).')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError(t.err_pdf_big)
      return
    }

    setPdfLoading(true)
    setError(null)
    setPdfFileName(file.name)

    try {
      const extractedText = await extractTextFromPdf(file)

      if (extractedText.trim().length < 20) {
        // Kein Text gefunden → wahrscheinlich gescanntes PDF
        setError(null)
        setPdfFileName(null)
        // Zeige hilfreiche Erklärung statt kurzer Fehlermeldung
        setError(t.err_pdf_scan)
        return
      }

      setBriefText(extractedText)
      setError(null)
    } catch (e: any) {
      setPdfFileName(null)
      setError(t.err_pdf_scan)
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Bild-Datei verarbeiten ─────────────────────────────────────
  const processImageFile = async (file: File) => {
    const SUPPORTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!SUPPORTED.includes(file.type)) {
      setError(t.err_img_fmt)
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError(t.err_img_big)
      return
    }

    setImageLoading(true)
    setError(null)
    // Bei Bild: Text und PDF zurücksetzen
    setBriefText('')
    setPdfFileName(null)

    try {
      const compressed = await compressImage(file)
      setImageData({ ...compressed, fileName: file.name })
      setError(null)
    } catch {
      setError('Bild konnte nicht verarbeitet werden. Bitte nochmal versuchen.')
    } finally {
      setImageLoading(false)
    }
  }

  // ── Datei verarbeiten (PDF oder Bild) ──────────────────────────
  const processFile = async (file: File) => {
    if (file.type === 'application/pdf') {
      // Bei PDF: Bild zurücksetzen
      setImageData(null)
      await processPdfFile(file)
    } else if (file.type.startsWith('image/')) {
      await processImageFile(file)
    } else {
      setError(t.err_no_file)
    }
  }

  // ── Drag & Drop Handler ─────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }

  // ── Datei-Auswahl per Klick ─────────────────────────────────────
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
    e.target.value = ''
  }

  // ── Brief analysieren ───────────────────────────────────────────
  const analyse = async (forceAnalyse = false) => {
    const trimmed   = briefText.trim()
    const hasImage  = imageData !== null
    const hasText   = trimmed.length >= 20

    // Etwas muss vorhanden sein
    if (!hasImage && !hasText) {
      setError(t.err_empty)
      return
    }

    // Paywall prüfen — alle 3 Schichten
    if (!isPaid && isFreeLimitReached(count)) {
      setShowPaywall(true)
      return
    }

    // Langtextwarnung: nur bei reinem Text, nicht bei Bild
    if (!hasImage && !forceAnalyse && trimmed.length > CHAR_LIMIT) {
      setShowLongTextWarning(true)
      return
    }

    setShowLongTextWarning(false)
    setLoading(true)
    setError(null)
    setAntwortbrief(null)
    setWasTruncated(false)

    try {
      const includeLetter = planHatBrief(plan)

      // Request-Body: Bild ODER Text + isPaid-Flag für Server-seitigen IP-Check
      const requestBody = hasImage
        ? { briefImage: { data: imageData!.base64, mediaType: imageData!.mediaType }, includeLetter, isPaid, language: lang }
        : { briefText: trimmed, includeLetter, isPaid, language: lang }

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Unbekannter Fehler')

      setResult(data.result)
      setAntwortbrief(data.antwortbrief || null)
      setWasTruncated(!hasImage && trimmed.length > CHAR_LIMIT)
      setScreen('result')

      const newCount = count + 1
      setCount(newCount)
      markFreeUsed(newCount)

      // Vollständige Analyse speichern (für Upgrade-Flow)
      saveFullResult(data.result, data.antwortbrief || null)

      // History speichern
      saveToHistory(data.result, data.result?.brieftyp || '')

      // E-Mail Capture: nach der ersten kostenlosen Analyse anzeigen (wenn noch keine E-Mail gespeichert)
      const savedEmail = localStorage.getItem('ak_capture_email')
      if (!isPaid && newCount >= FREE_LIMIT && !savedEmail) {
        setTimeout(() => setShowEmailCapture(true), 2000)
      }

    } catch (e: any) {
      setError(e.message || 'Analyse fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  // ── Brief kopieren ──────────────────────────────────────────────
  const copyBrief = () => {
    if (!antwortbrief) return
    const text = [
      antwortbrief.empfaenger_block,
      '',
      `Betreff: ${antwortbrief.betreff}`,
      '',
      antwortbrief.inhalt,
    ].join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // ── Brief herunterladen ─────────────────────────────────────────
  const downloadBrief = () => {
    if (!antwortbrief) return
    const text = [
      antwortbrief.empfaenger_block,
      '',
      `Betreff: ${antwortbrief.betreff}`,
      '',
      antwortbrief.inhalt,
      '',
      '---',
      `Hinweis: ${antwortbrief.hinweis}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'amtsklar-antwortbrief.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Zurücksetzen ────────────────────────────────────────────────
  const reset = () => {
    setScreen('input')
    setResult(null)
    setAntwortbrief(null)
    setBriefText('')
    setError(null)
    setCopied(false)
    setPdfFileName(null)
    setImageData(null)
    setImageLoading(false)
    setWasTruncated(false)
    setShowLongTextWarning(false)
  }

  // ── Dringlichkeits-Styling ──────────────────────────────────────
  const urg = result
    ? (URGENCY[result.dringlichkeit] || URGENCY.mittel)
    : URGENCY.mittel

  // ── Plan-Anzeige im Header ──────────────────────────────────────
  const planLabel: Record<Plan, string> = {
    none:      '',
    verstehen: 'Verstehen',
    handeln:   'Handeln',
    familie:   'Familie',
  }

  // ── Gemeinsame Styles ───────────────────────────────────────────
  const S = {
    app: {
      background: '#EEF4FB',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid #C5D8ED',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky' as const,
      top: 0,
      background: '#FFFFFF',
      zIndex: 10,
      boxShadow: '0 1px 12px rgba(15,36,64,0.08)',
    },
    scroll: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '24px 20px 48px',
    },
    inner: {
      maxWidth: 640,
      margin: '0 auto',
      width: '100%',
    },
    card: {
      background: '#FFFFFF',
      border: '1px solid #C5D8ED',
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
    },
    label: {
      fontSize: 10,
      fontWeight: 600 as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '1.2px',
      color: '#4A6A90',
      marginBottom: 8,
    },
    btn: {
      width: '100%',
      padding: 15,
      background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: 12,
      fontSize: 16,
      fontWeight: 700 as const,
      cursor: 'pointer' as const,
    },
    btnOut: {
      width: '100%',
      padding: 13,
      background: 'transparent',
      color: '#2A5080',
      border: '1.5px solid #C5D8ED',
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 500 as const,
      cursor: 'pointer' as const,
      marginTop: 12,
    },
    ta: {
      width: '100%',
      background: '#FFFFFF',
      border: '1.5px solid #C5D8ED',
      borderRadius: 14,
      padding: 16,
      color: '#0F2440',
      fontFamily: 'inherit',
      fontSize: 14,
      lineHeight: 1.65,
      resize: 'vertical' as const,
      minHeight: 220,
      outline: 'none',
    },
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={S.app}>

      {/* ── PAYWALL MODAL ── */}
      {showPaywall && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,36,64,0.7)',
          zIndex: 100,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '16px 12px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #C5D8ED',
            borderRadius: 16,
            padding: '20px 16px',
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(15,36,64,0.2)',
            margin: 'auto',
          }}>

            {/* Titel */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>
                {t.price_choose}
              </div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.5 }}>
                {t.pay_sub1} {t.pay_sub2}
              </div>
            </div>

            {/* Monatlich / Jährlich Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: yearlyBilling ? '#6A8AAA' : '#0F2440', fontWeight: yearlyBilling ? 400 : 600 }}>{t.monthly}</span>
              <div
                onClick={() => setYearlyBilling(y => !y)}
                style={{ width: 42, height: 23, borderRadius: 12, background: yearlyBilling ? '#C9963A' : '#C5D8ED', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div style={{ position: 'absolute', top: 3, left: yearlyBilling ? 21 : 3, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, color: yearlyBilling ? '#0F2440' : '#6A8AAA', fontWeight: yearlyBilling ? 600 : 400 }}>{t.yearly}</span>
              {yearlyBilling && (
                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  {t.months_free}
                </span>
              )}
            </div>

            {/* 3 Plan-Karten — kompakt */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>

              {/* Verstehen */}
              <div style={{
                border: '1.5px solid #C5D8ED', borderRadius: 10,
                padding: '12px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', marginBottom: 4 }}>Verstehen</div>
                <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#0F2440', marginBottom: 2 }}>{yearlyBilling ? '€2,49' : '€2,99'}</div>
                <div style={{ fontSize: 10, color: '#6A8AAA', marginBottom: 8 }}>{t.per_month}</div>
                <div style={{ fontSize: 10, color: '#4A6A90', marginBottom: 10, lineHeight: 1.4 }}>
                  {t.plan_v.slice(0,3).map((f,i) => <div key={i}>✓ {f}</div>)}
                  <div style={{color:'#C5D8ED'}}>✗ {t.plan_f[5]?.split('—')[0]}</div>
                </div>
                <button
                  onClick={() => openCheckout('verstehen')}
                  style={{
                    width: '100%', padding: '7px 0',
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 7, fontSize: 11, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  {t.btn_choose}
                </button>
              </div>

              {/* Handeln (hervorgehoben) */}
              <div style={{
                border: '2px solid #C9963A', borderRadius: 10,
                padding: '12px 8px', textAlign: 'center',
                background: 'rgba(201,150,58,0.04)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                  color: '#FFFFFF', fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>
                  {t.badge_popular}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#C9963A', textTransform: 'uppercase', marginBottom: 4 }}>Handeln</div>
                <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#0F2440', marginBottom: 2 }}>{yearlyBilling ? '€4,19' : '€4,99'}</div>
                <div style={{ fontSize: 10, color: '#6A8AAA', marginBottom: 8 }}>{t.per_month}</div>
                <div style={{ fontSize: 10, color: '#4A6A90', marginBottom: 10, lineHeight: 1.4 }}>
                  {t.plan_h.slice(0,3).map((f,i) => <div key={i}>✓ {f}</div>)}
                  <div style={{color:'#C5D8ED'}}>✗ {t.plan_f[7]?.split('—')[0]}</div>
                </div>
                <button
                  onClick={() => openCheckout('handeln')}
                  style={{
                    width: '100%', padding: '7px 0',
                    background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                    border: 'none', borderRadius: 7,
                    fontSize: 11, fontWeight: 700,
                    color: '#FFFFFF', cursor: 'pointer',
                  }}
                >
                  {t.btn_choose_arrow}
                </button>
              </div>

              {/* Familie */}
              <div style={{
                border: '1.5px solid #C5D8ED', borderRadius: 10,
                padding: '12px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', marginBottom: 4 }}>Familie</div>
                <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#0F2440', marginBottom: 2 }}>{yearlyBilling ? '€6,79' : '€7,99'}</div>
                <div style={{ fontSize: 10, color: '#6A8AAA', marginBottom: 8 }}>{t.per_month}</div>
                <div style={{ fontSize: 10, color: '#4A6A90', marginBottom: 10, lineHeight: 1.4 }}>
                  {t.plan_f.slice(0,2).map((f,i) => <div key={i}>✓ {f}</div>)}
                  <div>✓ {t.plan_f[5]?.split('—')[0]}</div>
                  <div>✓ {t.plan_f[7]?.split('—')[0]}</div>
                </div>
                <button
                  onClick={() => openCheckout('familie')}
                  style={{
                    width: '100%', padding: '7px 0',
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 7, fontSize: 11, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  {t.btn_choose}
                </button>
              </div>
            </div>

            {/* E-Mail Verifikation für bestehende Abonnenten */}
            <div style={{ borderTop: '1px solid #C5D8ED', paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: '#4A6A90', marginBottom: 6, textAlign: 'center' }}>
                {t.already_sub}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  value={email}
                  placeholder="deine@email.com"
                  onChange={e => setEmail(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1.5px solid #C5D8ED', fontSize: 13, outline: 'none' }}
                />
                <button
                  onClick={verifySubscription}
                  disabled={verifying}
                  style={{
                    padding: '8px 12px', borderRadius: 7, fontSize: 12,
                    fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  {verifying ? t.verifying : t.verify_btn}
                </button>
              </div>
              {error && (
                <div style={{ fontSize: 11, color: '#E08080', marginTop: 6, textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowPaywall(false); setError(null) }}
              style={{ ...S.btnOut, fontSize: 12, marginTop: 10, padding: '8px' }}
            >
              {t.close_btn}
            </button>

          </div>
        </div>
      )}

      {/* ── LANGER TEXT WARNUNG MODAL ── */}
      {showLongTextWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,36,64,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #C5D8ED',
            borderRadius: 16, padding: '28px 24px', maxWidth: 480, width: '100%',
            boxShadow: '0 20px 60px rgba(15,36,64,0.2)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#0F2440', marginBottom: 8 }}>
                {t.longtext_title}
              </div>
              <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.65 }}>
                {briefText.trim().length.toLocaleString('de-AT')} {t.longtext_chars}
              </div>
            </div>

            {/* Info-Box */}
            <div style={{
              background: '#F5F8FC', border: '1px solid #C5D8ED',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2440', marginBottom: 8 }}>
                {t.longtext_what}
              </div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.65 }}>
                {t.longtext_info}
              </div>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 13, color: '#2A5080', lineHeight: 1.8 }}>
                <li>{t.longtext_item1}</li>
                <li>{t.longtext_item2}</li>
                <li>{t.longtext_item3}</li>
              </ul>
            </div>

            {/* Empfehlung */}
            <div style={{
              background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#8B6020', lineHeight: 1.65,
            }}>
              {t.longtext_tip}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button
                onClick={() => analyse(true)}
                style={{
                  padding: '13px', background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  color: '#FFFFFF', cursor: 'pointer',
                }}
              >
                {t.longtext_btn_analyse}
              </button>
              <button
                onClick={() => setShowLongTextWarning(false)}
                style={{
                  padding: '13px', background: '#F5F8FC',
                  border: '1.5px solid #C5D8ED', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: '#2A5080', cursor: 'pointer',
                }}
              >
                {t.longtext_btn_shorten}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={S.header}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LanguageSwitcher />
          {/* Plan-Badge oder Gratis-Zähler */}
          {isPaid ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, color: '#4CAF82',
                background: 'rgba(76,175,130,0.1)',
                border: '1px solid rgba(76,175,130,0.3)',
                borderRadius: 6, padding: '3px 10px',
              }}>
                ✓ {planLabel[plan]}
              </span>
              <a
                href="https://customer.paddle.com/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                title={lang === 'de' ? 'Abo verwalten' : lang === 'en' ? 'Manage subscription' : lang === 'tr' ? 'Aboneliği yönet' : 'Abo verwalten'}
                style={{
                  fontSize: 11, color: '#6A8AAA', textDecoration: 'none',
                  border: '1px solid #C5D8ED', borderRadius: 6, padding: '3px 8px',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ⚙️ {lang === 'de' ? 'Abo' : lang === 'en' ? 'Manage' : lang === 'tr' ? 'Yönet' : lang === 'it' ? 'Gestisci' : lang === 'ru' ? 'Управл.' : lang === 'pl' ? 'Zarządzaj' : lang === 'hu' ? 'Kezelés' : 'Abo'}
              </a>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: '#2A5080' }}>
              {isPaid ? '' : (Math.max(0, FREE_LIMIT - count) === 0 ? t.free_none : `${Math.max(0, FREE_LIMIT - count)} ${t.free_left}`)}
            </span>
          )}
        </div>
      </div>

      {/* ── HAUPTINHALT ── */}
      <div style={S.scroll}>
        <div style={S.inner}>

          {/* ════════════════════════════════════════
              INPUT-BEREICH
          ════════════════════════════════════════ */}
          {screen === 'input' && !loading && (
            <div className="fade-in">

              <h1 style={{
                fontFamily: 'Libre Baskerville,serif', fontSize: 28,
                fontWeight: 700, lineHeight: 1.2, color: '#0F2440', marginBottom: 8
              }}>
                Brief<br/>erhalten?
              </h1>

              <p style={{ fontSize: 15, color: '#2A5080', lineHeight: 1.6, marginBottom: 20 }}>
                {t.analyse_tagline}
              </p>

              {/* ── UPLOAD ZONE: PDF + Foto ── */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${
                    isDragOver   ? '#C9963A'
                    : imageData  ? '#4CAF82'
                    : pdfFileName ? '#4CAF82'
                    : '#C5D8ED'
                  }`,
                  borderRadius: 12,
                  padding: imageData ? '12px 20px' : '20px',
                  marginBottom: 12,
                  background: isDragOver
                    ? 'rgba(201,150,58,0.06)'
                    : (imageData || pdfFileName)
                    ? 'rgba(76,175,130,0.05)'
                    : '#FAFCFF',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {/* Versteckter File-Input — PDF + Bilder */}
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />

                {/* ── Laden ── */}
                {(pdfLoading || imageLoading) ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20,
                      border: '2px solid #C5D8ED',
                      borderTop: '2px solid #C9963A',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}/>
                    <span style={{ fontSize: 14, color: '#2A5080' }}>
                      {imageLoading ? 'Foto wird vorbereitet…' : 'PDF wird gelesen…'}
                    </span>
                  </div>

                /* ── Foto geladen → Vorschau ── */
                ) : imageData ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={imageData.preview}
                      alt="Vorschau"
                      style={{
                        width: 52, height: 52, objectFit: 'cover',
                        borderRadius: 6, border: '1px solid #C5D8ED', flexShrink: 0,
                      }}
                    />
                    <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF82' }}>
                        ✓ Foto geladen — bereit zur Analyse
                      </div>
                      <div style={{ fontSize: 12, color: '#6A8AAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {imageData.fileName}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setImageData(null) }}
                      style={{ background: 'none', border: 'none', color: '#6A8AAA', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}
                      title="Entfernen"
                    >×</button>
                  </div>

                /* ── PDF geladen ── */
                ) : pdfFileName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF82' }}>{t.pdf_loaded}</div>
                      <div style={{ fontSize: 12, color: '#6A8AAA' }}>{pdfFileName}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setPdfFileName(null); setBriefText('') }}
                      style={{ marginLeft: 8, background: 'none', border: 'none', color: '#6A8AAA', cursor: 'pointer', fontSize: 18 }}
                      title="Entfernen"
                    >×</button>
                  </div>

                /* ── Drag-Over ── */
                ) : isDragOver ? (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#C9963A' }}>
                      {t.drop_over}
                    </div>
                  </div>

                /* ── Normal ── */
                ) : (
                  <div>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📎 📸</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2440', marginBottom: 4 }}>
                      {t.drop_title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6A8AAA', lineHeight: 1.6 }}>
                      {t.drop_or}<br/>
                      <span style={{ color: '#4A6A90' }}>PDF · JPG · PNG · WEBP</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trennlinie — ausblenden wenn Bild geladen */}
              {!imageData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#C5D8ED' }}/>
                  <span style={{ fontSize: 12, color: '#6A8AAA', whiteSpace: 'nowrap' }}>
                    {t.text_divider}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#C5D8ED' }}/>
                </div>
              )}

              {/* Textarea — ausblenden wenn Bild geladen */}
              {!imageData && (
                <textarea
                  style={{
                    ...S.ta,
                    border: pdfFileName ? '1.5px solid rgba(76,175,130,0.5)' : '1.5px solid #C5D8ED',
                  }}
                  placeholder={t.placeholder.replace('\\n', '\n')}
                  value={briefText}
                  onChange={e => {
                    setBriefText(e.target.value)
                    if (pdfFileName && e.target.value !== briefText) setPdfFileName(null)
                  }}
                  rows={pdfFileName ? 8 : 11}
                />
              )}

              {/* Zeichenzähler — nur bei Text, nicht bei Bild */}
              {!imageData && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 4, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12 }}>
                    {briefText.length > CHAR_DANGER ? (
                      <span style={{ color: '#E05252', fontWeight: 600 }}>
                        {t.char_long}
                      </span>
                    ) : briefText.length > CHAR_WARN ? (
                      <span style={{ color: '#D4943A', fontWeight: 500 }}>
                        {t.char_warn}
                      </span>
                    ) : (
                      <span style={{ color: '#6A8AAA' }}>
                        {pdfFileName && <span style={{ color: '#4CAF82' }}>{t.pdf_extracted}</span>}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: briefText.length > CHAR_DANGER ? 700 : 400,
                    color: briefText.length > CHAR_DANGER ? '#E05252'
                         : briefText.length > CHAR_WARN   ? '#D4943A'
                         : '#6A8AAA',
                  }}>
                    {briefText.length.toLocaleString('de-AT')} / {CHAR_LIMIT.toLocaleString('de-AT')} Zeichen
                  </span>
                </div>
              )}

              {/* Fehlermeldung */}
              {error && (
                <div style={{
                  background: 'rgba(224,82,82,0.08)',
                  border: '1px solid rgba(224,82,82,0.25)',
                  borderRadius: 10, padding: '12px 16px',
                  color: '#E05252', fontSize: 14, marginBottom: 14,
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Analyse-Button */}
              <button
                style={{
                  ...S.btn,
                  opacity: (imageData !== null || briefText.trim().length >= 20) ? 1 : 0.5,
                  cursor:  (imageData !== null || briefText.trim().length >= 20) ? 'pointer' : 'not-allowed',
                }}
                onClick={() => analyse(false)}
                disabled={imageData === null && briefText.trim().length < 20}
              >
                {imageData ? t.btn_foto : pdfFileName ? t.btn_pdf : t.btn_brief}
              </button>

              {/* Wie es funktioniert */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12, marginTop: 28, paddingTop: 24,
                borderTop: '1px solid #C5D8ED',
              }}>
                {[
                  ['📎📸', t.step1_t, t.step1_d],
                  ['⚖️',   t.step2_t, t.step2_d],
                  ['✅',   t.step3_t, t.step3_d],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2440', marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#4A6A90', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Letzte Analysen */}
              {history.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #C5D8ED' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                    🕐 {lang === 'de' ? 'Zuletzt analysiert' : lang === 'en' ? 'Recently analysed' : lang === 'tr' ? 'Son analizler' : lang === 'it' ? 'Analisi recenti' : lang === 'ru' ? 'Недавние анализы' : 'Zuletzt analysiert'}
                  </div>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: '#F5F8FC',
                      borderRadius: 8, marginBottom: 6, fontSize: 12,
                    }}>
                      <span style={{ fontSize: 14 }}>
                        {h.dringlichkeit === 'hoch' ? '🔴' : h.dringlichkeit === 'mittel' ? '🟡' : '🟢'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#0F2440', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.brieftyp}
                        </div>
                        <div style={{ color: '#6A8AAA', fontSize: 11 }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rechtlicher Hinweis */}
              <div style={{
                background: '#F5F8FC', border: '1px solid #C5D8ED',
                borderRadius: 12, padding: '14px 16px', marginTop: 28,
                fontSize: 11, color: '#6A8AAA', lineHeight: 1.65, textAlign: 'center',
              }}>
                {t.legal_note.split('—')[0]}—{' '}
                <strong style={{ color: '#2A5080' }}>ersetzt keine Rechtsberatung.</strong>
                {' '}Fotos und PDFs werden lokal verarbeitet und nicht gespeichert.
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════
              LADE-ANIMATION
          ════════════════════════════════════════ */}
          {loading && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '60vh', gap: 24, textAlign: 'center',
            }}>
              <div style={{
                width: 50, height: 50,
                border: '3px solid #C5D8ED',
                borderTop: '3px solid #C9963A',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}/>
              <div>
                <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 20, color: '#0F2440' }}>
                  {t.loading_title}
                </div>
                <div style={{ fontSize: 13, color: '#4A6A90', marginTop: 8 }}>
                  {t.loading_sub}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              ERGEBNIS-BEREICH
          ════════════════════════════════════════ */}
          {screen === 'result' && result && !loading && (
            <div className="fade-in">

              {/* Analyse gespeichert — Banner wenn nach Upgrade wiederhergestellt */}
              {isPaid && planHatBrief(plan) && antwortbrief && (() => {
                const saved = loadSavedResult()
                const wasRestored = saved && (Date.now() - saved.savedAt < 30000) // innerhalb 30 Sek
                return wasRestored ? (
                  <div style={{
                    background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.3)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                    fontSize: 13, color: '#1A6A50', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    ✅ {lang === 'de' ? 'Ihre Analyse wurde wiederhergestellt — der Antwortbrief ist bereit!' :
                        lang === 'en' ? 'Your analysis has been restored — the reply letter is ready!' :
                        lang === 'tr' ? 'Analiziniz geri yüklendi — yanıt mektubu hazır!' :
                        '✅ Analyse wiederhergestellt!'}
                  </div>
                ) : null
              })()}

              {/* Kürzungshinweis wenn Text zu lang war */}
              {wasTruncated && (
                <div style={{
                  background: 'rgba(212,148,58,0.08)',
                  border: '1.5px solid rgba(212,148,58,0.3)',
                  borderRadius: 12, padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>✂️</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#8B6020', marginBottom: 4 }}>
                        {t.trunc_title}
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.6 }}>
                        {t.trunc_desc_full}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Brieftyp und Dringlichkeit */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', flexWrap: 'wrap',
                gap: 10, marginBottom: 20,
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(201,150,58,0.12)',
                    border: '1px solid rgba(201,150,58,0.28)',
                    borderRadius: 8, padding: '5px 12px',
                    fontSize: 13, color: '#C9963A', fontWeight: 500, marginBottom: 6,
                  }}>
                    📄 {result.brieftyp}
                  </div>
                  <div style={{ fontSize: 12, color: '#4A6A90' }}>
                    Von: {result.behoerde}
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600,
                  background: urg.bg, border: `1px solid ${urg.border}`, color: urg.color,
                }}>
                  {urg.icon} {t[urg.labelKey]}
                </div>
              </div>

              {/* Pflichtaktion */}
              {result.handlungsempfehlung && (
                <div style={{
                  borderRadius: 14, padding: 20, marginBottom: 14,
                  border: `2px solid ${urg.border}`, background: urg.bg,
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>
                      {result.handlungsempfehlung.prioritaet === 'kritisch' ? '🚨'
                        : result.handlungsempfehlung.prioritaet === 'hoch' ? '⚡'
                        : '📌'}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 10, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '1.2px',
                        color: '#4A6A90', marginBottom: 5,
                      }}>
                        {t.lbl_pflicht}
                      </div>
                      <div style={{
                        fontFamily: 'Libre Baskerville,serif', fontSize: 20,
                        fontWeight: 700, color: '#0F2440', lineHeight: 1.25,
                      }}>
                        {result.handlungsempfehlung.aktion}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.6)', borderRadius: 10,
                    padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {result.handlungsempfehlung.bis_wann && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A3A5C' }}>
                        <span>🗓</span>
                        <span><strong>Wann:</strong> {result.handlungsempfehlung.bis_wann}</span>
                      </div>
                    )}
                    {result.handlungsempfehlung.wie && (
                      <div style={{
                        fontSize: 14, lineHeight: 1.65, color: '#1A3A5C',
                        borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10,
                      }}>
                        {result.handlungsempfehlung.wie}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Was bedeutet dieser Brief */}
              <div style={S.card}>
                <div style={S.label}>{t.lbl_meaning}</div>
                <div style={{ fontSize: 15, lineHeight: 1.75, color: '#1A3A5C' }}>
                  {result.einfache_erklaerung}
                </div>
              </div>

              {/* Frist */}
              {result.frist?.hat_frist && (() => {
                const deadlineDate = calcDeadlineDate(result.frist.frist_text)
                const dl = deadlineDate ? formatDeadline(deadlineDate, lang) : null
                return (
                <div style={{ ...S.card, background: urg.bg, border: `1.5px solid ${urg.border}` }}>
                  <div style={{ ...S.label, color: urg.color }}>{t.lbl_frist}</div>
                  <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: urg.color, marginBottom: 6 }}>
                    {result.frist.frist_text}
                  </div>
                  {/* Konkretes Datum + Countdown + Calendar Link */}
                  {dl && (() => {
                    const calLink = googleCalendarLink({
                      title: result.handlungsempfehlung?.aktion || result.brieftyp,
                      deadlineDate: calcDeadlineDate(result.frist.frist_text)!,
                      description: result.einfache_erklaerung || '',
                      lang,
                    })
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 10,
                        padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>
                            {dl.urgency === 'critical' ? '🚨' : dl.urgency === 'warn' ? '⚠️' : '📅'}
                          </span>
                          <div>
                            <div style={{
                              fontSize: 17, fontWeight: 700,
                              color: dl.urgency === 'critical' ? '#E05252' : dl.urgency === 'warn' ? '#D4943A' : '#0F2440'
                            }}>
                              {dl.dateStr}
                            </div>
                            <div style={{
                              fontSize: 13, fontWeight: 600,
                              color: dl.urgency === 'critical' ? '#E05252' : dl.urgency === 'warn' ? '#D4943A' : '#4CAF82'
                            }}>
                              {daysLeftLabel(dl.daysLeft, lang)}
                            </div>
                          </div>
                        </div>
                        <a
                          href={calLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(255,255,255,0.9)', border: '1px solid #C5D8ED',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12,
                            color: '#2A5080', textDecoration: 'none', fontWeight: 600,
                            whiteSpace: 'nowrap', flexShrink: 0,
                          }}
                        >
                          📅 {lang === 'de' ? 'Zum Kalender' : lang === 'en' ? 'Add to Calendar' : lang === 'tr' ? 'Takvime ekle' : lang === 'it' ? 'Al calendario' : lang === 'ru' ? 'В календарь' : lang === 'pl' ? 'Do kalendarza' : lang === 'hr' || lang === 'sr' ? 'U kalendar' : lang === 'hu' ? 'Naptárba' : lang === 'sl' ? 'V koledar' : lang === 'sk' ? 'Do kalendára' : lang === 'ro' ? 'În calendar' : 'Add to Calendar'}
                        </a>
                      </div>
                    )
                  })()}
                  {result.frist.frist_hinweis && (
                    <div style={{ fontSize: 13, color: '#1A3A5C', lineHeight: 1.55 }}>
                      {result.frist.frist_hinweis}
                    </div>
                  )}
                </div>
                )
              })()}

              {/* Was jetzt tun */}
              {result.was_tun?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>{t.lbl_tun}</div>
                  {result.was_tun.map((schritt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        width: 26, height: 26,
                        background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#FFFFFF',
                        flexShrink: 0, marginTop: 2,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1A3A5C' }}>
                        {schritt.replace(/^Schritt\s*\d+[.:]\s*/i, '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rechtsmittel */}
              {result.rechtsmittel?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>{t.lbl_rechtsmittel}</div>
                  {result.rechtsmittel.map((rm, i) => (
                    <div key={i} style={{ border: '1px solid #C5D8ED', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#0F2440', marginBottom: 4 }}>
                        {rm.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#C9963A', marginBottom: 6, fontWeight: 500 }}>
                        Frist: {rm.frist} · Wohin: {rm.wohin}
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.5 }}>
                        {rm.beschreibung}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wichtige Hinweise */}
              {result.wichtige_hinweise?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>{t.lbl_hinweise}</div>
                  {result.wichtige_hinweise.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#C9963A', flexShrink: 0, marginTop: 7,
                      }}/>
                      <div style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.6 }}>{h}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Konsequenzen */}
              {result.konsequenzen && (
                <div style={{
                  ...S.card,
                  background: 'rgba(224,82,82,0.04)',
                  border: '1.5px solid rgba(224,82,82,0.2)',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, fontFamily: 'serif', fontSize: 17, fontWeight: 700, color: '#E05252' }}>
                    <span>⛔</span> Was passiert wenn Sie NICHTS tun?
                  </div>

                  {result.konsequenzen.frist_verpasst && (
                    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(224,82,82,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#E05252', opacity: 0.7, marginBottom: 6 }}>
                        {t.konq_sofort}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1A3A5C' }}>
                        {result.konsequenzen.frist_verpasst}
                      </div>
                    </div>
                  )}

                  {result.konsequenzen.naechste_schritte_behoerde?.length > 0 && (
                    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(224,82,82,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#E05252', opacity: 0.7, marginBottom: 8 }}>
                        {t.konq_behoerde}
                      </div>
                      {result.konsequenzen.naechste_schritte_behoerde.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{
                            width: 26, height: 26,
                            background: 'linear-gradient(135deg,#C03030,#E05252)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ fontSize: 14, color: '#1A3A5C', lineHeight: 1.65 }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.konsequenzen.langfristige_folgen && (
                    <div style={{ background: 'rgba(224,82,82,0.06)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#E05252', marginBottom: 6 }}>
                        Langfristige Folgen
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1A3A5C' }}>
                        {result.konsequenzen.langfristige_folgen}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* {t.lbl_grundlage} mit RIS-Links */}
              {result.rechtsgrundlage?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>{t.lbl_grundlage}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {result.rechtsgrundlage.map((r, i) => (
                      <a
                        key={i}
                        href={getRISUrl(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#F5F8FC', border: '1px solid #C5D8ED',
                          borderRadius: 6, padding: '4px 10px',
                          fontSize: 12, color: '#2A5080',
                          fontFamily: 'monospace', textDecoration: 'none',
                        }}
                      >
                        {r} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* {t.lbl_beratung} */}
              {result.beratungsstellen?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>{t.lbl_beratung}</div>
                  {result.beratungsstellen.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9, fontSize: 14, color: '#1A3A5C', lineHeight: 1.5 }}>
                      <span>🏛️</span><span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ANTWORTBRIEF (nur für Handeln & Familie) ── */}
              {planHatBrief(plan) && antwortbrief ? (
                <div style={{
                  background: '#FFFFFF',
                  border: '2px solid rgba(201,150,58,0.4)',
                  borderRadius: 14, padding: 20, marginBottom: 12,
                  boxShadow: '0 4px 20px rgba(201,150,58,0.1)',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>✉️</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#C9963A', marginBottom: 2 }}>
                        {t.letter_ready}
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080' }}>
                        {t.letter_hint}
                      </div>
                      {lang !== 'de' && (
                        <div style={{ fontSize: 11, color: '#6A8AAA', marginTop: 4, fontStyle: 'italic' }}>
                          🇩🇪 {t.letter_lang_note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Empfänger */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#4A6A90', marginBottom: 6 }}>
                      {t.lbl_to}
                    </div>
                    <div style={{
                      background: '#F5F8FC', border: '1px solid #C5D8ED',
                      borderRadius: 8, padding: '10px 14px',
                      fontSize: 14, color: '#1A3A5C', lineHeight: 1.65,
                      whiteSpace: 'pre-line',
                    }}>
                      {antwortbrief.empfaenger_block}
                    </div>
                  </div>

                  {/* Betreff */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#4A6A90', marginBottom: 6 }}>
                      {t.lbl_subject}
                    </div>
                    <div style={{
                      background: '#F5F8FC', border: '1px solid #C5D8ED',
                      borderRadius: 8, padding: '10px 14px',
                      fontSize: 14, fontWeight: 600, color: '#0F2440',
                    }}>
                      {antwortbrief.betreff}
                    </div>
                  </div>

                  {/* Brieftext */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#4A6A90', marginBottom: 6 }}>
                      {t.lbl_body}
                    </div>
                    <div style={{
                      background: '#F5F8FC', border: '1px solid #C5D8ED',
                      borderRadius: 8, padding: '14px 16px',
                      fontSize: 14, color: '#1A3A5C', lineHeight: 1.8,
                      whiteSpace: 'pre-line', fontFamily: 'inherit',
                    }}>
                      {antwortbrief.inhalt}
                    </div>
                  </div>

                  {/* Hinweis */}
                  <div style={{
                    background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                    fontSize: 12, color: '#C9963A', lineHeight: 1.6,
                  }}>
                    💡 {antwortbrief.hinweis}
                  </div>

                  {/* Buttons: Kopieren + Download */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      onClick={copyBrief}
                      style={{
                        padding: '11px', border: '1.5px solid #C5D8ED',
                        background: copied ? 'rgba(76,175,130,0.1)' : '#F5F8FC',
                        borderColor: copied ? 'rgba(76,175,130,0.4)' : '#C5D8ED',
                        borderRadius: 10, fontSize: 14, fontWeight: 600,
                        color: copied ? '#4CAF82' : '#2A5080', cursor: 'pointer',
                      }}
                    >
                      {copied ? t.btn_copied : t.btn_copy}
                    </button>
                    <button
                      onClick={downloadBrief}
                      style={{
                        padding: '11px',
                        background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                        border: 'none', borderRadius: 10,
                        fontSize: 14, fontWeight: 700,
                        color: '#FFFFFF', cursor: 'pointer',
                      }}
                    >
                      {t.btn_dl}
                    </button>
                  </div>
                </div>

              ) : !planHatBrief(plan) ? (
                /* Upgrade-Teaser für Verstehen-User */
                <div style={{
                  background: 'rgba(201,150,58,0.06)',
                  border: '1.5px solid rgba(201,150,58,0.25)',
                  borderRadius: 14, padding: 20, marginBottom: 12,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>✉️</div>
                  <div style={{ fontFamily: 'serif', fontSize: 17, fontWeight: 700, color: '#0F2440', marginBottom: 8 }}>
                    {t.upgrade_title}
                  </div>
                  <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.65, marginBottom: 16 }}>
                    {t.upgrade_text}
                  </div>
                  <button
                    onClick={() => setShowPaywall(true)}
                    style={{
                      background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                      color: '#FFFFFF', border: 'none',
                      borderRadius: 10, padding: '12px 24px',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {t.upgrade_btn}
                  </button>
                </div>
              ) : null}

              {/* E-Mail Capture Banner — erscheint 2s nach der 1. kostenlosen Analyse */}
              {showEmailCapture && !isPaid && !captureSubmitted && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(201,150,58,0.08), rgba(15,36,64,0.05))',
                  border: '1.5px solid rgba(201,150,58,0.35)',
                  borderRadius: 14, padding: '18px 20px', marginTop: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>💌</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Libre Baskerville,serif', fontSize: 15, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>
                        {lang === 'de' ? 'Ergebnis per E-Mail + Frist-Erinnerung?' :
                         lang === 'en' ? 'Get results by email + deadline reminder?' :
                         lang === 'tr' ? 'Sonuç e-posta + son tarih hatırlatması?' :
                         lang === 'it' ? 'Risultato via e-mail + promemoria scadenza?' :
                         lang === 'ru' ? 'Результат по e-mail + напоминание о сроке?' :
                         lang === 'pl' ? 'Wynik e-mailem + przypomnienie o terminie?' :
                         lang === 'ro' ? 'Rezultat pe e-mail + reminder termen?' :
                         lang === 'hu' ? 'Eredmény e-mailben + határidő emlékeztető?' :
                         lang === 'sr' ? 'Rezultat e-mailom + podsetnik roka?' :
                         lang === 'hr' ? 'Rezultat e-mailom + podsjetnik roka?' :
                         lang === 'sl' ? 'Rezultat po e-pošti + opomnik roka?' :
                         lang === 'sk' ? 'Výsledok e-mailom + pripomienka termínu?' :
                         'Get results by email + deadline reminder?'}
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080', marginBottom: 12, lineHeight: 1.5 }}>
                        {lang === 'de' ? 'Wir senden dir das Ergebnis und erinnern dich rechtzeitig an deine Frist. Kostenlos, kein Spam.' :
                         lang === 'en' ? "We'll send you the analysis and remind you before your deadline. Free, no spam." :
                         lang === 'tr' ? 'Analiz sonucunu ve son tarihi hatırlatacağız. Ücretsiz, spam yok.' :
                         lang === 'it' ? "Ti inviamo l'analisi e ti ricordiamo prima della scadenza. Gratis, niente spam." :
                         lang === 'ru' ? 'Пришлём результат и напомним о сроке. Бесплатно, без спама.' :
                         lang === 'pl' ? 'Wyślemy wynik i przypomnimy o terminie. Bezpłatnie, bez spamu.' :
                         lang === 'ro' ? 'Trimitem rezultatul și vă amintim termenul. Gratuit, fără spam.' :
                         lang === 'hu' ? 'Elküldjük az eredményt és emlékeztetünk a határidőre. Ingyen, spam nélkül.' :
                         "We'll send you the analysis and remind you before your deadline. Free, no spam."}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="email"
                          value={captureEmail}
                          placeholder="deine@email.com"
                          onChange={e => setCaptureEmail(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && captureEmail.includes('@')) {
                              localStorage.setItem('ak_capture_email', captureEmail)
                              setCaptureSubmitted(true)
                              setShowEmailCapture(false)
                              try {
                                await fetch('/api/capture-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: captureEmail, lang }),
                                })
                              } catch {}
                            }
                          }}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 8,
                            border: '1.5px solid #C5D8ED', fontSize: 14,
                            outline: 'none', color: '#0F2440',
                          }}
                        />
                        <button
                          onClick={async () => {
                            if (!captureEmail.includes('@')) return
                            localStorage.setItem('ak_capture_email', captureEmail)
                            setCaptureSubmitted(true)
                            setShowEmailCapture(false)
                            // Send to API (fire and forget)
                            try {
                              await fetch('/api/capture-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: captureEmail, lang }),
                              })
                            } catch {}
                          }}
                          style={{
                            padding: '9px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                            border: 'none', color: '#fff', fontSize: 13,
                            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {lang === 'de' ? 'Senden →' : 'Send →'}
                        </button>
                        <button
                          onClick={() => setShowEmailCapture(false)}
                          style={{
                            padding: '9px 10px', borderRadius: 8,
                            background: 'transparent', border: '1.5px solid #C5D8ED',
                            color: '#6A8AAA', fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rechtlicher Hinweis */}
              <div style={{
                background: '#F5F8FC', border: '1px solid #C5D8ED',
                borderRadius: 12, padding: '14px 16px',
                marginTop: 20, marginBottom: 4,
                fontSize: 11, color: '#6A8AAA', lineHeight: 1.65, textAlign: 'center',
              }}>
                ⚖️{' '}
                <strong style={{ color: '#2A5080' }}>Rechtlicher Hinweis:</strong>{' '}
                {t.legal_text}{' '}
                Quelle Gesetze:{' '}
                <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: '#2A5080' }}>
                  RIS.bka.gv.at
                </a>
                {' '}(CC BY 4.0)
              </div>

              {/* Aktions-Buttons: PDF + Teilen + Zurück */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {/* Alles kopieren */}
                <button
                  onClick={() => {
                    const lines = [
                      `📄 ${result.brieftyp} — ${result.behoerde}`,
                      '',
                      result.einfache_erklaerung,
                      '',
                      result.frist?.hat_frist ? `⏰ ${result.frist.frist_text}` : '',
                      result.handlungsempfehlung?.aktion ? `✅ ${result.handlungsempfehlung.aktion}` : '',
                      result.handlungsempfehlung?.bis_wann ? `📅 ${result.handlungsempfehlung.bis_wann}` : '',
                      '',
                      ...(result.was_tun || []).map((s: string, i: number) => `${i+1}. ${s}`),
                    ].filter(Boolean).join('\n')
                    navigator.clipboard?.writeText(lines)
                      .then(() => {
                        const btn = document.getElementById('copy-all-btn')
                        if (btn) { btn.textContent = '✓ Kopiert!'; setTimeout(() => { btn.textContent = lang === 'de' ? '📋 Alles kopieren' : lang === 'en' ? '📋 Copy all' : '📋 Kopieren' }, 2000) }
                      })
                  }}
                  id="copy-all-btn"
                  style={{
                    flex: 1, minWidth: 140,
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  📋 {lang === 'de' ? 'Alles kopieren' : lang === 'en' ? 'Copy all' : lang === 'tr' ? 'Tümünü kopyala' : lang === 'it' ? 'Copia tutto' : lang === 'ru' ? 'Скопировать всё' : lang === 'pl' ? 'Kopiuj wszystko' : 'Kopieren'}
                </button>

                {/* WhatsApp teilen */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    (lang === 'de' ? `Behördenbrief analysiert mit AmtsKlar:\n\n📄 ${result.brieftyp}\n${result.einfache_erklaerung}\n${result.frist?.hat_frist ? `⏰ Frist: ${result.frist.frist_text}` : ''}\n\nwww.amtsklar.at`
                    : `Official letter analysed with AmtsKlar:\n\n📄 ${result.brieftyp}\n${result.einfache_erklaerung}\n\nwww.amtsklar.at`)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, minWidth: 140, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    background: '#25D366', border: 'none',
                    borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600,
                    color: '#FFFFFF', textDecoration: 'none',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {lang === 'de' ? 'Teilen' : lang === 'en' ? 'Share' : lang === 'tr' ? 'Paylaş' : lang === 'it' ? 'Condividi' : lang === 'ru' ? 'Поделиться' : lang === 'pl' ? 'Udostępnij' : 'Teilen'}
                </a>

                {/* Drucken */}
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1, minWidth: 140,
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  🖨️ {lang === 'de' ? 'Als PDF speichern' : lang === 'en' ? 'Save as PDF' : lang === 'tr' ? 'PDF olarak kaydet' : 'Save PDF'}
                </button>

                {/* Zurück */}
                <button style={{ ...S.btnOut, flex: 1, minWidth: 140 }} onClick={reset}>
                  {t.btn_new}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
