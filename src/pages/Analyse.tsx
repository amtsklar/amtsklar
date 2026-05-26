import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
    label: 'Dringend',
    icon: '⚠️',
  },
  mittel: {
    color: '#D4943A',
    bg: 'rgba(212,148,58,0.08)',
    border: 'rgba(212,148,58,0.25)',
    label: 'Mittelfristig',
    icon: '⏰',
  },
  niedrig: {
    color: '#4CAF82',
    bg: 'rgba(76,175,130,0.08)',
    border: 'rgba(76,175,130,0.25)',
    label: 'Keine Eile',
    icon: '✓',
  },
}

// Anzahl kostenloser Analysen
const FREE_LIMIT = 1

// Zeichenlimit für Texteingabe
const CHAR_LIMIT   = 8000  // Ab hier wird Text gekürzt
const CHAR_WARN    = 6000  // Ab hier gelbe Warnung
const CHAR_DANGER  = 7500  // Ab hier rote Warnung

// LocalStorage Keys
const SK = {
  count: 'ak_count',   // Anzahl bisheriger Analysen
  paid:  'ak_paid',    // boolean: hat bezahlt
  plan:  'ak_plan',    // 'verstehen' | 'handeln' | 'familie'
  email: 'ak_email',   // E-Mail des Abonnenten
}

// Paddle Preis-IDs je Paket (aus .env)
const PADDLE_PRICES: Record<string, string> = {
  verstehen: import.meta.env.VITE_PADDLE_PRICE_VERSTEHEN || '',
  handeln:   import.meta.env.VITE_PADDLE_PRICE_HANDELN   || '',
  familie:   import.meta.env.VITE_PADDLE_PRICE_FAMILIE   || '',
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
const Logo = () => (
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
      <div style={{ fontSize: 9, color: '#4A6A90', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Österreich · Behördenbriefe sofort verstehen
      </div>
    </div>
  </Link>
)

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

    setCount(savedCount)
    setIsPaid(savedPaid)
    setPlan(savedPlan)
    setEmail(savedEmail)

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
      window.history.replaceState({}, '', '/#/analyse')
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
    const priceId = PADDLE_PRICES[selectedPlan]

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
      setError('Zahlungssystem wird gerade eingerichtet — bitte in Kürze erneut versuchen.')
      setShowPaywall(false)
      return
    }

    // Paddle.js noch nicht geladen → kurz warten und nochmal versuchen
    setError('Zahlungssystem lädt gerade — bitte einen Moment warten und nochmal klicken.')
  }

  // ── Subscription per E-Mail prüfen ─────────────────────────────
  const verifySubscription = async () => {
    if (!email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.')
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
      } else {
        setError('Kein aktives Abonnement für diese E-Mail gefunden.')
      }
    } catch {
      setError('Prüfung fehlgeschlagen. Bitte erneut versuchen.')
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
      setError('PDF zu groß (max. 15 MB). Bitte Text manuell einfügen.')
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
        setError(
          'Dieses PDF enthält keinen lesbaren Text (wahrscheinlich gescannt). ' +
          'Bitte den Text manuell einfügen: PDF öffnen → Text markieren → kopieren → hier einfügen.'
        )
        return
      }

      setBriefText(extractedText)
      setError(null)
    } catch (e: any) {
      setPdfFileName(null)
      setError('PDF konnte nicht gelesen werden. Bitte Text manuell einfügen.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Bild-Datei verarbeiten ─────────────────────────────────────
  const processImageFile = async (file: File) => {
    const SUPPORTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!SUPPORTED.includes(file.type)) {
      setError('Unterstützte Formate: JPG, PNG, WEBP (Handy-Foto) oder PDF (Bescheid).')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('Bild zu groß (max. 25 MB). Bitte Foto in niedrigerer Auflösung aufnehmen.')
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
      setError('Bitte PDF oder Foto (JPG, PNG, WEBP) hochladen.')
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
      setError('Bitte Text einfügen oder Foto/PDF hochladen.')
      return
    }

    // Paywall prüfen
    if (!isPaid && count >= FREE_LIMIT) {
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

      // Request-Body: Bild ODER Text
      const requestBody = hasImage
        ? { briefImage: { data: imageData!.base64, mediaType: imageData!.mediaType }, includeLetter }
        : { briefText: trimmed, includeLetter }

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Unbekannter Fehler')

      setResult(data.result)
      setAntwortbrief(data.antwortbrief || null)
      // Kürzungshinweis nur bei Text
      setWasTruncated(!hasImage && trimmed.length > CHAR_LIMIT)
      setScreen('result')

      const newCount = count + 1
      setCount(newCount)
      localStorage.setItem(SK.count, String(newCount))

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
      padding: '14px 20px',
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #C5D8ED',
            borderRadius: 16,
            padding: '32px 24px',
            maxWidth: 560,
            width: '100%',
            boxShadow: '0 20px 60px rgba(15,36,64,0.2)',
          }}>

            {/* Titel */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'serif', fontSize: 32, color: '#C9963A', marginBottom: 10 }}>§</div>
              <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 8 }}>
                Wähle dein Paket
              </div>
              <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.6 }}>
                Deine kostenlose Analyse ist aufgebraucht.<br/>
                Wähle ein Paket für unbegrenzte Analysen.
              </div>
            </div>

            {/* 3 Plan-Karten */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>

              {/* Verstehen */}
              <div style={{
                border: '1.5px solid #C5D8ED', borderRadius: 12,
                padding: '16px 12px', textAlign: 'center',
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', marginBottom: 6 }}>Verstehen</div>
                <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>€2,99</div>
                <div style={{ fontSize: 11, color: '#6A8AAA', marginBottom: 12 }}>pro Monat</div>
                <div style={{ fontSize: 11, color: '#2A5080', marginBottom: 12, lineHeight: 1.5 }}>
                  Analyse & Fristen
                </div>
                <button
                  onClick={() => openCheckout('verstehen')}
                  style={{
                    width: '100%', padding: '8px 0',
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  Wählen
                </button>
              </div>

              {/* Handeln (hervorgehoben) */}
              <div style={{
                border: '2px solid #C9963A', borderRadius: 12,
                padding: '16px 12px', textAlign: 'center',
                background: 'rgba(201,150,58,0.04)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                  color: '#FFFFFF', fontSize: 10, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>
                  ⭐ Beliebt
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#C9963A', textTransform: 'uppercase', marginBottom: 6 }}>Handeln</div>
                <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>€4,99</div>
                <div style={{ fontSize: 11, color: '#6A8AAA', marginBottom: 12 }}>pro Monat</div>
                <div style={{ fontSize: 11, color: '#2A5080', marginBottom: 12, lineHeight: 1.5 }}>
                  + Antwortbrief
                </div>
                <button
                  onClick={() => openCheckout('handeln')}
                  style={{
                    width: '100%', padding: '8px 0',
                    background: 'linear-gradient(135deg,#B8832A,#D4A84B)',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    color: '#FFFFFF', cursor: 'pointer',
                  }}
                >
                  Wählen →
                </button>
              </div>

              {/* Familie */}
              <div style={{
                border: '1.5px solid #C5D8ED', borderRadius: 12,
                padding: '16px 12px', textAlign: 'center',
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6A8AAA', textTransform: 'uppercase', marginBottom: 6 }}>Familie</div>
                <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#0F2440', marginBottom: 4 }}>€7,99</div>
                <div style={{ fontSize: 11, color: '#6A8AAA', marginBottom: 12 }}>pro Monat</div>
                <div style={{ fontSize: 11, color: '#2A5080', marginBottom: 12, lineHeight: 1.5 }}>
                  Bis zu 5 Personen
                </div>
                <button
                  onClick={() => openCheckout('familie')}
                  style={{
                    width: '100%', padding: '8px 0',
                    background: '#F5F8FC', border: '1.5px solid #C5D8ED',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: '#2A5080', cursor: 'pointer',
                  }}
                >
                  Wählen
                </button>
              </div>
            </div>

            {/* E-Mail Verifikation für bestehende Abonnenten */}
            <div style={{ borderTop: '1px solid #C5D8ED', paddingTop: 16 }}>
              <div style={{ fontSize: 12, color: '#4A6A90', marginBottom: 8, textAlign: 'center' }}>
                Bereits Abonnent? E-Mail eingeben:
              </div>
              <input
                type="email"
                value={email}
                placeholder="deine@email.com"
                onChange={e => setEmail(e.target.value)}
                style={{ ...S.ta, minHeight: 'auto', padding: '10px 14px', marginBottom: 8, borderRadius: 8 }}
              />
              <button
                onClick={verifySubscription}
                disabled={verifying}
                style={{ ...S.btn, background: '#F5F8FC', border: '1.5px solid #C5D8ED', color: '#2A5080', padding: 11, fontSize: 14 }}
              >
                {verifying ? 'Prüfe...' : 'Zugang prüfen'}
              </button>
              {error && (
                <div style={{ fontSize: 12, color: '#E08080', marginTop: 8, textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Schließen */}
            <button
              onClick={() => { setShowPaywall(false); setError(null) }}
              style={{ ...S.btnOut, fontSize: 13, marginTop: 12 }}
            >
              Schließen
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
                Sehr langer Text erkannt
              </div>
              <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.65 }}>
                Ihr Text hat <strong>{briefText.trim().length.toLocaleString('de-AT')} Zeichen</strong> — das entspricht einem sehr umfangreichen Bescheid (z.B. mehrseitiger Baubescheid).
              </div>
            </div>

            {/* Info-Box */}
            <div style={{
              background: '#F5F8FC', border: '1px solid #C5D8ED',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2440', marginBottom: 8 }}>
                💡 Was wird analysiert?
              </div>
              <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.65 }}>
                AmtsKlar analysiert die ersten 8.000 Zeichen. Bei österreichischen Bescheiden enthält dieser Teil typischerweise:
              </div>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 13, color: '#2A5080', lineHeight: 1.8 }}>
                <li><strong>Spruch</strong> (die eigentliche Entscheidung)</li>
                <li><strong>Begründung</strong> (Erklärung)</li>
                <li><strong>Rechtsmittelbelehrung</strong> (Fristen)</li>
              </ul>
            </div>

            {/* Empfehlung */}
            <div style={{
              background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#8B6020', lineHeight: 1.65,
            }}>
              <strong>💡 Tipp:</strong> Für den besten Analyse-Ergebnis: Fügen Sie nur den <strong>Spruch</strong> (Seite 1-2) und die <strong>Rechtsmittelbelehrung</strong> (letzte Seite) ein — das sind die wichtigsten Teile für Fristen und Handlungsempfehlungen.
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
                Trotzdem analysieren (erste 8.000 Zeichen)
              </button>
              <button
                onClick={() => setShowLongTextWarning(false)}
                style={{
                  padding: '13px', background: '#F5F8FC',
                  border: '1.5px solid #C5D8ED', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: '#2A5080', cursor: 'pointer',
                }}
              >
                Text selbst kürzen (empfohlen)
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={S.header}>
        <Logo />
        {/* Plan-Badge oder Gratis-Zähler */}
        {isPaid ? (
          <span style={{
            fontSize: 12, color: '#4CAF82',
            background: 'rgba(76,175,130,0.1)',
            border: '1px solid rgba(76,175,130,0.3)',
            borderRadius: 6, padding: '3px 10px',
          }}>
            ✓ {planLabel[plan]}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#2A5080' }}>
            {Math.max(0, FREE_LIMIT - count)} gratis
          </span>
        )}
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
                PDF reinziehen oder Text einfügen — sofort verstehen was er bedeutet.
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF82' }}>✓ PDF geladen</div>
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
                      Hier ablegen
                    </div>
                  </div>

                /* ── Normal ── */
                ) : (
                  <div>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📎 📸</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2440', marginBottom: 4 }}>
                      PDF oder Foto hier reinziehen
                    </div>
                    <div style={{ fontSize: 12, color: '#6A8AAA', lineHeight: 1.6 }}>
                      oder klicken zum Auswählen<br/>
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
                    oder Text direkt einfügen
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
                  placeholder={'Brieftext hier einfügen…\n\nz.B. Strafverfügung, Finanzamtsbescheid, AMS-Schreiben, Inkasso, Mietkündigung…'}
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
                        ⚠️ Text sehr lang — wird auf 8.000 Zeichen gekürzt
                      </span>
                    ) : briefText.length > CHAR_WARN ? (
                      <span style={{ color: '#D4943A', fontWeight: 500 }}>
                        ⏳ Text lang — unter 8.000 Zeichen empfohlen
                      </span>
                    ) : (
                      <span style={{ color: '#6A8AAA' }}>
                        {pdfFileName && <span style={{ color: '#4CAF82' }}>· aus PDF extrahiert</span>}
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
                {imageData ? '📸 Foto analysieren →' : pdfFileName ? '📄 PDF analysieren →' : 'Brief analysieren →'}
              </button>

              {/* Wie es funktioniert */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12, marginTop: 28, paddingTop: 24,
                borderTop: '1px solid #C5D8ED',
              }}>
                {[
                  ['📎📸', 'PDF oder Foto', 'Reinziehen oder einfügen'],
                  ['⚖️', 'Analysieren', 'Österr. Gesetze, 82 Bereiche'],
                  ['✅', 'Verstehen', 'Klare Schritte & Fristen'],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2440', marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#4A6A90', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Rechtlicher Hinweis */}
              <div style={{
                background: '#F5F8FC', border: '1px solid #C5D8ED',
                borderRadius: 12, padding: '14px 16px', marginTop: 28,
                fontSize: 11, color: '#6A8AAA', lineHeight: 1.65, textAlign: 'center',
              }}>
                AmtsKlar informiert und erklärt —{' '}
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
                  Analysiere Ihren Brief…
                </div>
                <div style={{ fontSize: 13, color: '#4A6A90', marginTop: 8 }}>
                  Prüfe österreichische Gesetze & Fristen
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              ERGEBNIS-BEREICH
          ════════════════════════════════════════ */}
          {screen === 'result' && result && !loading && (
            <div className="fade-in">

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
                        Analyse basiert auf den ersten 8.000 Zeichen
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080', lineHeight: 1.6 }}>
                        Ihr Dokument war sehr umfangreich. Spruch, Begründung und Rechtsmittelbelehrung wurden vollständig erfasst. Falls weitere Details wichtig sind: fügen Sie den entsprechenden Abschnitt separat ein.
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
                  {urg.icon} {urg.label}
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
                        Ihre nächste Pflichtaktion
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
                <div style={S.label}>Was bedeutet dieser Brief?</div>
                <div style={{ fontSize: 15, lineHeight: 1.75, color: '#1A3A5C' }}>
                  {result.einfache_erklaerung}
                </div>
              </div>

              {/* Frist */}
              {result.frist?.hat_frist && (
                <div style={{ ...S.card, background: urg.bg, border: `1.5px solid ${urg.border}` }}>
                  <div style={{ ...S.label, color: urg.color }}>⏰ Frist beachten</div>
                  <div style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: urg.color, marginBottom: 6 }}>
                    {result.frist.frist_text}
                  </div>
                  {result.frist.frist_hinweis && (
                    <div style={{ fontSize: 13, color: '#1A3A5C', lineHeight: 1.55 }}>
                      {result.frist.frist_hinweis}
                    </div>
                  )}
                </div>
              )}

              {/* Was jetzt tun */}
              {result.was_tun?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Was jetzt tun?</div>
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
                  <div style={S.label}>Rechtsmittel & Einspruch</div>
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
                  <div style={S.label}>⚠️ Wichtige Hinweise</div>
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
                        Sofort bei Fristversäumnis
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1A3A5C' }}>
                        {result.konsequenzen.frist_verpasst}
                      </div>
                    </div>
                  )}

                  {result.konsequenzen.naechste_schritte_behoerde?.length > 0 && (
                    <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(224,82,82,0.15)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#E05252', opacity: 0.7, marginBottom: 8 }}>
                        Nächste Schritte der Behörde
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

              {/* Rechtsgrundlage mit RIS-Links */}
              {result.rechtsgrundlage?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Rechtsgrundlage</div>
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

              {/* Kostenlose Beratungsstellen */}
              {result.beratungsstellen?.length > 0 && (
                <div style={S.card}>
                  <div style={S.label}>Kostenlose Beratungsstellen</div>
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
                        Ihr Antwortbrief — fertig zum Ausdrucken
                      </div>
                      <div style={{ fontSize: 13, color: '#2A5080' }}>
                        Platzhalter [IN ECKIGEN KLAMMERN] durch Ihre echten Daten ersetzen
                      </div>
                    </div>
                  </div>

                  {/* Empfänger */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#4A6A90', marginBottom: 6 }}>
                      An:
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
                      Betreff:
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
                      Briefinhalt:
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
                      {copied ? '✓ Kopiert!' : '📋 Kopieren'}
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
                      ⬇️ Herunterladen
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
                    KI schreibt den Antwortbrief für Sie
                  </div>
                  <div style={{ fontSize: 14, color: '#2A5080', lineHeight: 1.65, marginBottom: 16 }}>
                    Mit dem <strong>Handeln-Paket</strong> erstellt AmtsKlar automatisch einen
                    fertigen Einspruchs- oder Antwortbrief. Nur noch ausdrucken, unterschreiben
                    und per Einschreiben versenden.
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
                    Auf Handeln upgraden — €4,99/Monat →
                  </button>
                </div>
              ) : null}

              {/* Rechtlicher Hinweis */}
              <div style={{
                background: '#F5F8FC', border: '1px solid #C5D8ED',
                borderRadius: 12, padding: '14px 16px',
                marginTop: 20, marginBottom: 4,
                fontSize: 11, color: '#6A8AAA', lineHeight: 1.65, textAlign: 'center',
              }}>
                ⚖️{' '}
                <strong style={{ color: '#2A5080' }}>Rechtlicher Hinweis:</strong>{' '}
                AmtsKlar dient zur Information. Ersetzt keine Rechtsberatung durch einen zugelassenen Anwalt.{' '}
                Quelle Gesetze:{' '}
                <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: '#2A5080' }}>
                  RIS.bka.gv.at
                </a>
                {' '}(CC BY 4.0)
              </div>

              {/* Zurück-Button */}
              <button style={S.btnOut} onClick={reset}>
                ← Neuen Brief analysieren
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
