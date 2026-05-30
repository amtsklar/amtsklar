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
import { useLang } from '../i18n/LangContext'

type Plan = 'none' | 'verstehen' | 'handeln' | 'familie'

// Template data — static (always Austrian law, so German names are correct)
// but descriptions, wann etc. need translation
const VORLAGEN_BASE = [
  { datei:'01_Einspruch_Strafverfuegung.docx', icon:'🚨', gesetz:'§ 49 VStG', fristFarbe:'#E05252' },
  { datei:'02_Beschwerde_Finanzamt.docx',      icon:'💰', gesetz:'§ 243 BAO', fristFarbe:'#E05252' },
  { datei:'03_Widerspruch_AMS.docx',           icon:'📋', gesetz:'§ 11 AlVG', fristFarbe:'#D4943A' },
  { datei:'04_Antwort_Inkasso.docx',           icon:'📬', gesetz:'Schuldnerberatung kostenlos', fristFarbe:'#4CAF82' },
  { datei:'05_Einspruch_Miete.docx',           icon:'🏠', gesetz:'§ 33 MRG', fristFarbe:'#D4943A' },
]

const VORLAGEN_TEXT: Record<string, { titel:string; beschreibung:string; wann:string; frist:string }[]> = {
  de: [
    { titel:'Einspruch gegen Strafverfügung', beschreibung:'Für Strafverfügungen vom Magistrat, der BH oder Polizei — z.B. Parkstrafen, Geschwindigkeitsüberschreitungen, Verwaltungsübertretungen.', wann:'Wenn du mit der Strafe nicht einverstanden bist oder den Vorwurf bestreitest. Ein Einspruch kostet nichts und führt zur Überprüfung.', frist:'2 Wochen ab Zustellung'},
    { titel:'Beschwerde gegen Finanzamtsbescheid', beschreibung:'Für Bescheide des Finanzamts betreffend Einkommensteuer, Umsatzsteuer, Nachzahlungen oder Rückforderungen.', wann:'Wenn du mit der Berechnung oder dem Ergebnis nicht einverstanden bist. Auch bei SVS-Bescheiden für Selbstständige verwendbar.', frist:'1 Monat ab Zustellung'},
    { titel:'Beschwerde gegen AMS-Bescheid', beschreibung:'Für Bescheide des AMS betreffend Sperrfristen, Leistungseinstellungen oder Rückforderungen von Arbeitslosengeld.', wann:'Wenn du einen triftigen Grund für dein Verhalten hattest oder den Vorwurf bestreitest. Die AK hilft hier kostenlos!', frist:'4 Wochen ab Zustellung'},
    { titel:'Antwort auf Inkasso-Schreiben', beschreibung:'Für Mahnschreiben von Inkassobüros. Enthält zwei Varianten: Forderung bestreiten ODER Ratenzahlung beantragen.', wann:'Immer — egal ob du die Forderung anerkennst oder nicht. Inkassobüros dürfen NICHT pfänden, das können nur Gerichte!', frist:'Keine gesetzliche Frist — rasch antworten empfohlen'},
    { titel:'Einspruch gegen Mietkündigung', beschreibung:'Für Kündigungsschreiben des Vermieters oder der Hausverwaltung. Prüft Formfehler, wichtige Gründe und soziale Härte.', wann:'Wenn du die Kündigung anfechten möchtest — wegen Formfehlern, fehlendem wichtigem Grund oder sozialer Härte. Mietervereinigung hilft kostenlos!', frist:'4 Wochen — Klage beim Bezirksgericht'},
  ],
  en: [
    { titel:'Appeal against penalty notice', beschreibung:'For penalty notices from the magistrate, district authority or police — e.g. parking fines, speeding, administrative offences.', wann:'If you disagree with the penalty or dispute the allegation. An appeal is free and leads to a review.', frist:'2 weeks from service'},
    { titel:'Complaint against tax assessment', beschreibung:'For tax office assessments regarding income tax, VAT, additional payments or refund claims.', wann:'If you disagree with the calculation or outcome. Also usable for SVS decisions for self-employed persons.', frist:'1 month from service'},
    { titel:'Complaint against employment office decision', beschreibung:'For AMS decisions regarding suspension periods, benefit terminations or repayment demands for unemployment benefit.', wann:'If you had a valid reason for your behaviour or dispute the allegation. The Chamber of Labour helps for free!', frist:'4 weeks from service'},
    { titel:'Reply to debt collection letter', beschreibung:'For demand letters from debt collectors. Contains two variants: dispute the claim OR request instalment payment.', wann:'Always — regardless of whether you acknowledge the claim or not. Important: debt collectors CANNOT seize assets, only courts can!', frist:'No legal deadline — prompt reply recommended'},
    { titel:'Appeal against tenancy termination', beschreibung:'For termination notices from the landlord or property management. Checks for formal errors, important grounds and social hardship.', wann:'If you want to challenge the termination — due to formal errors, lack of valid grounds or social hardship. Tenant association helps for free!', frist:'4 weeks — action at district court'},
  ],
}
// For all other languages use English as fallback
const VORLAGEN_UI: Record<string, { title:string; subtitle:string; download:string; locked:string; when:string; deadline:string; disclaimer:string; cta:string; upgrade_hint:string }> = {
  de: { title:'Mustervorlagen', subtitle:'5 fertige Vorlagen für die häufigsten Behördensituationen — für Handeln & Familie Abonnenten zum Download.', download:'⬇️ Vorlage herunterladen', locked:'🔒 Handeln & Familie', when:'💡 Wann verwenden?', deadline:'⏰ Frist:', disclaimer:'Diese Mustervorlagen dienen als Orientierungshilfe und ersetzen keine individuelle Rechtsberatung. Bei wichtigen Angelegenheiten: Rechtsanwalt oder Arbeiterkammer (kostenlos für Mitglieder) konsultieren.', cta:'Brief jetzt analysieren →', upgrade_hint:'Für den Download: Handeln- oder Familie-Paket wählen'},
  en: { title:'Templates', subtitle:'5 ready-made templates for the most common official situations — available for download with Handeln & Familie subscriptions.', download:'⬇️ Download template', locked:'🔒 Handeln & Familie', when:'💡 When to use?', deadline:'⏰ Deadline:', disclaimer:'These templates serve as guidance and do not replace individual legal advice. For important matters: consult a lawyer or the Chamber of Labour (free for members).', cta:'Analyse letter now →', upgrade_hint:'To download: choose the Handeln or Familie plan'},
  tr: { title:'Şablonlar', subtitle:'En yaygın resmi durumlar için 5 hazır şablon — Handeln & Familie aboneliğiyle indirilebilir.', download:'⬇️ Şablonu indir', locked:'🔒 Handeln & Familie', when:'💡 Ne zaman kullanılır?', deadline:'⏰ Son tarih:', disclaimer:'Bu şablonlar rehberlik amacıyla sunulmaktadır ve bireysel hukuki danışmanlığın yerini tutmaz.', cta:'Mektubu şimdi analiz et →', upgrade_hint:'İndirmek için: Handeln veya Familie paketini seçin'},
  sr: { title:'Predlošci', subtitle:'5 gotovih predložaka za najčešće zvanične situacije — dostupni za preuzimanje uz Handeln & Familie pretplatu.', download:'⬇️ Preuzmi predložak', locked:'🔒 Handeln & Familie', when:'💡 Kada koristiti?', deadline:'⏰ Rok:', disclaimer:'Ovi predlošci služe kao vodilje i ne zamenjuju individualnu pravnu konsultaciju.', cta:'Analiziraj pismo sada →', upgrade_hint:'Za preuzimanje: izaberite Handeln ili Familie paket'},
  hr: { title:'Predlošci', subtitle:'5 gotovih predložaka za najčešće službene situacije — dostupni za preuzimanje uz Handeln & Familie pretplatu.', download:'⬇️ Preuzmi predložak', locked:'🔒 Handeln & Familie', when:'💡 Kada koristiti?', deadline:'⏰ Rok:', disclaimer:'Ovi predlošci služe kao smjernice i ne zamjenjuju individualnu pravnu savjetodavnost.', cta:'Analiziraj pismo sada →', upgrade_hint:'Za preuzimanje: odaberite Handeln ili Familie paket'},
  hu: { title:'Sablonok', subtitle:'5 kész sablon a leggyakoribb hivatalos helyzetekre — letölthető Handeln & Familie előfizetéssel.', download:'⬇️ Sablon letöltése', locked:'🔒 Handeln & Familie', when:'💡 Mikor használja?', deadline:'⏰ Határidő:', disclaimer:'Ezek a sablonok tájékoztató jellegűek és nem helyettesítik az egyéni jogi tanácsadást.', cta:'Most elemezze a levelet →', upgrade_hint:'Letöltéshez: válassza a Handeln vagy Familie csomagot'},
  sl: { title:'Predloge', subtitle:'5 pripravljenih predlog za najpogostejše uradne situacije — na voljo za prenos z naročnino Handeln & Familie.', download:'⬇️ Prenesi predlogo', locked:'🔒 Handeln & Familie', when:'💡 Kdaj uporabiti?', deadline:'⏰ Rok:', disclaimer:'Te predloge služijo kot smernice in ne nadomeščajo individualnega pravnega nasveta.', cta:'Zdaj analiziraj pismo →', upgrade_hint:'Za prenos: izberite paket Handeln ali Familie'},
  sk: { title:'Šablóny', subtitle:'5 hotových šablón pre najbežnejšie úradné situácie — dostupné na stiahnutie s predplatným Handeln & Familie.', download:'⬇️ Stiahnuť šablónu', locked:'🔒 Handeln & Familie', when:'💡 Kedy použiť?', deadline:'⏰ Termín:', disclaimer:'Tieto šablóny slúžia ako návod a nenahrádzajú individuálne právne poradenstvo.', cta:'Teraz analyzovať list →', upgrade_hint:'Pre stiahnutie: vyberte balík Handeln alebo Familie'},
  ro: { title:'Șabloane', subtitle:'5 șabloane gata de utilizat pentru cele mai frecvente situații oficiale — disponibile pentru descărcare cu abonamentul Handeln & Familie.', download:'⬇️ Descarcă șablonul', locked:'🔒 Handeln & Familie', when:'💡 Când să utilizați?', deadline:'⏰ Termen:', disclaimer:'Aceste șabloane servesc drept ghiduri și nu înlocuiesc consultanța juridică individuală.', cta:'Analizează scrisoarea acum →', upgrade_hint:'Pentru descărcare: alegeți pachetul Handeln sau Familie'},
  pl: { title:'Szablony', subtitle:'5 gotowych szablonów do najczęstszych sytuacji urzędowych — dostępne do pobrania z subskrypcją Handeln & Familie.', download:'⬇️ Pobierz szablon', locked:'🔒 Handeln & Familie', when:'💡 Kiedy używać?', deadline:'⏰ Termin:', disclaimer:'Szablony te służą jako wskazówki i nie zastępują indywidualnej porady prawnej.', cta:'Analizuj pismo teraz →', upgrade_hint:'Aby pobrać: wybierz pakiet Handeln lub Familie'},
  ru: { title:'Шаблоны', subtitle:'5 готовых шаблонов для наиболее распространённых официальных ситуаций — доступны для скачивания с подпиской Handeln & Familie.', download:'⬇️ Скачать шаблон', locked:'🔒 Handeln & Familie', when:'💡 Когда использовать?', deadline:'⏰ Срок:', disclaimer:'Эти шаблоны служат ориентиром и не заменяют индивидуальную юридическую консультацию.', cta:'Анализировать письмо сейчас →', upgrade_hint:'Для скачивания: выберите тариф Handeln или Familie'},
  it: { title:'Modelli', subtitle:'5 modelli pronti per le situazioni ufficiali più comuni — disponibili per il download con abbonamento Handeln & Familie.', download:'⬇️ Scarica il modello', locked:'🔒 Handeln & Familie', when:'💡 Quando usare?', deadline:'⏰ Scadenza:', disclaimer:'Questi modelli servono come guida e non sostituiscono la consulenza legale individuale.', cta:'Analizza la lettera ora →', upgrade_hint:'Per il download: scegliere il pacchetto Handeln o Familie'},
}

export default function Vorlagen() {
  const [isPaid, setIsPaid] = useState(false)
  const [plan, setPlan] = useState<Plan>('none')
  const { lang } = useLang()

  useEffect(() => {
    const savedPaid = localStorage.getItem('ak_paid') === 'true'
    const savedPlan = (localStorage.getItem('ak_plan') || 'none') as Plan
    setIsPaid(savedPaid)
    setPlan(savedPlan)
  }, [])

  const canDownload = isPaid && (plan === 'handeln' || plan === 'familie')
  const savedEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('ak_email') || localStorage.getItem('ak_capture_email') || '')
    : ''
  const ui = VORLAGEN_UI[lang] || VORLAGEN_UI.en
  const texts = VORLAGEN_TEXT[lang] || VORLAGEN_TEXT.en

  return (
    <div style={{ background: '#EEF4FB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #C5D8ED',
        background: '#FFFFFF', boxShadow: '0 1px 12px rgba(15,36,64,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <defs><linearGradient id="vg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D4A84B"/><stop offset="100%" stopColor="#A8731E"/>
            </linearGradient></defs>
            <rect width="34" height="34" rx="8" fill="url(#vg)"/>
            <text x="17" y="24" fontFamily="Georgia,serif" fontSize="19" fontWeight="bold" fill="white" textAnchor="middle">§</text>
          </svg>
          <div>
            <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:19, fontWeight:700, lineHeight:1 }}>
              <span style={{ color:'#0F2440', fontWeight:400 }}>Amts</span>
              <span style={{ color:'#C9963A', fontWeight:700 }}>Klar</span>
            </div>
            <div style={{ fontSize:9, color:'#4A6A90', textTransform:'uppercase', letterSpacing:'0.8px' }} className="logo-sub">
              {lang === 'de' ? 'Österreich · Behördenbriefe sofort verstehen' : 'Austria · Official letters explained instantly'}
            </div>
          </div>
        </Link>
        <Link to="/" style={{ fontSize:14, color:'#2A5080', textDecoration:'none' }}>← Zurück</Link>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily:'Libre Baskerville,serif', fontSize:30, fontWeight:700, color:'#0F2440', marginBottom:10 }}>
          {ui.title}
        </h1>
        <p style={{ fontSize:16, color:'#2A5080', lineHeight:1.7, marginBottom:32 }}>
          {ui.subtitle}
        </p>

        {/* Template cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {VORLAGEN_BASE.map((base, i) => {
            const text = texts[i] || texts[0]
            return (
              <div key={i} style={{
                background:'#FFFFFF', border:'1.5px solid #C5D8ED',
                borderRadius:14, padding:'20px 24px',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:28 }}>{base.icon}</span>
                    <div>
                      <div style={{ fontFamily:'Libre Baskerville,serif', fontSize:17, fontWeight:700, color:'#0F2440', marginBottom:4 }}>
                        {text.titel}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, background:'rgba(224,82,82,0.08)', color:base.fristFarbe, border:`1px solid ${base.fristFarbe}40`, borderRadius:6, padding:'2px 8px', fontWeight:600 }}>
                          {ui.deadline} {text.frist}
                        </span>
                        <span style={{ fontSize:11, background:'rgba(42,80,128,0.06)', color:'#2A5080', border:'1px solid #C5D8ED', borderRadius:6, padding:'2px 8px' }}>
                          {base.gesetz}
                        </span>
                      </div>
                    </div>
                  </div>
                  {canDownload ? (
                    <a
                      href={`/api/download-vorlage?file=${encodeURIComponent(base.datei)}&email=${encodeURIComponent(savedEmail)}`}
                      download={base.datei}
                      style={{
                        background:'linear-gradient(135deg,#B8832A,#D4A84B)',
                        color:'#FFFFFF', border:'none', borderRadius:10,
                        padding:'10px 18px', fontSize:13, fontWeight:700,
                        textDecoration:'none', whiteSpace:'nowrap', flexShrink:0,
                      }}
                    >
                      {ui.download}
                    </a>
                  ) : (
                    <div style={{
                      background:'#F5F8FC', border:'1px solid #C5D8ED',
                      borderRadius:10, padding:'10px 20px',
                      fontSize:13, color:'#9BBAD4', whiteSpace:'nowrap', flexShrink:0,
                    }}>
                      {ui.locked}
                    </div>
                  )}
                </div>

                <div style={{ fontSize:14, color:'#1A3A5C', lineHeight:1.7, marginBottom:10 }}>
                  {text.beschreibung}
                </div>

                <div style={{
                  background:'rgba(76,175,130,0.06)', border:'1px solid rgba(76,175,130,0.2)',
                  borderRadius:8, padding:'10px 14px',
                  fontSize:13, color:'#1A6A50', lineHeight:1.6,
                }}>
                  {ui.when} {text.wann}
                </div>
              </div>
            )
          })}
        </div>

        {!canDownload && (
          <div style={{
            background:'rgba(201,150,58,0.07)', border:'1.5px solid rgba(201,150,58,0.3)',
            borderRadius:12, padding:'16px 20px', marginTop:24,
            fontSize:14, color:'#8B6020', textAlign:'center',
          }}>
            🔒 {ui.upgrade_hint}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          background:'#F5F8FC', border:'1px solid #C5D8ED',
          borderRadius:12, padding:'16px 20px', marginTop:32,
          fontSize:13, color:'#6A8AAA', lineHeight:1.7,
        }}>
          ⚖️ <strong style={{ color:'#2A5080' }}>{lang === 'de' ? 'Rechtlicher Hinweis:' : 'Legal notice:'}</strong>{' '}
          {ui.disclaimer}
        </div>

        <div style={{ textAlign:'center', marginTop:40 }}>
          <Link to="/analyse" style={{
            background:'linear-gradient(135deg,#B8832A,#D4A84B)',
            color:'#FFFFFF', padding:'14px 32px', borderRadius:12,
            fontSize:16, fontWeight:700, textDecoration:'none',
          }}>
            {ui.cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
