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

/**
 * Berechnet ein konkretes Enddatum aus einem Fristtext.
 */
export function calcDeadlineDate(fristText: string): Date | null {
  if (!fristText) return null
  const t = fristText.toLowerCase()

  const wochen = t.match(/(\d+)\s*woch/)
  if (wochen) {
    const d = new Date()
    d.setDate(d.getDate() + parseInt(wochen[1]) * 7)
    return d
  }
  const weeks = t.match(/(\d+)\s*week/)
  if (weeks) {
    const d = new Date()
    d.setDate(d.getDate() + parseInt(weeks[1]) * 7)
    return d
  }
  const monate = t.match(/(\d+)\s*(monat|month|mese|mois|miesiąc|měsíc|lună|hónap|mesec)/)
  if (monate) {
    const d = new Date()
    d.setMonth(d.getMonth() + parseInt(monate[1]))
    return d
  }
  const tage = t.match(/(\d+)\s*(tag|day|giorno|jour|dzień|den|zi|nap|dan)/)
  if (tage) {
    const d = new Date()
    d.setDate(d.getDate() + parseInt(tage[1]))
    return d
  }
  if (/1\s*(jahr|year|anno|rok|an\b|év|leto)/.test(t)) {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d
  }
  return null
}

export function formatDeadline(date: Date, lang: string): {
  dateStr: string; daysLeft: number; urgency: 'critical' | 'warn' | 'ok'
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)

  const daysLeft = Math.ceil((copy.getTime() - today.getTime()) / 86400000)

  const localeMap: Record<string, string> = {
    de:'de-AT', en:'en-GB', tr:'tr-TR', sr:'sr-RS',
    hr:'hr-HR', hu:'hu-HU', sl:'sl-SI', sk:'sk-SK',
    ro:'ro-RO', pl:'pl-PL', ru:'ru-RU', it:'it-IT',
  }
  const dateStr = copy.toLocaleDateString(localeMap[lang] || 'de-AT', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const urgency = daysLeft <= 7 ? 'critical' : daysLeft <= 21 ? 'warn' : 'ok'
  return { dateStr, daysLeft, urgency }
}

export function daysLeftLabel(days: number, lang: string): string {
  if (days <= 0) {
    const m: Record<string, string> = {
      de:'Frist abgelaufen!', en:'Deadline expired!', tr:'Süre doldu!',
      sr:'Rok istekao!', hr:'Rok istekao!', hu:'Határidő lejárt!',
      sl:'Rok je potekel!', sk:'Termín uplynul!', ro:'Termenul a expirat!',
      pl:'Termin minął!', ru:'Срок истёк!', it:'Scadenza superata!',
    }
    return m[lang] || m.de
  }
  if (days === 1) {
    const m: Record<string, string> = {
      de:'Morgen ist der letzte Tag!', en:'Tomorrow is the last day!', tr:'Yarın son gün!',
      sr:'Sutra je poslednji dan!', hr:'Sutra je zadnji dan!', hu:'Holnap az utolsó nap!',
      sl:'Jutri je zadnji dan!', sk:'Zajtra je posledný deň!', ro:'Mâine e ultima zi!',
      pl:'Jutro jest ostatni dzień!', ru:'Завтра последний день!', it:'Domani è l ultimo giorno!',
    }
    return m[lang] || m.de
  }
  const m: Record<string, string> = {
    de:`noch ${days} Tage`, en:`${days} days left`, tr:`${days} gün kaldı`,
    sr:`još ${days} dana`, hr:`još ${days} dana`, hu:`még ${days} nap`,
    sl:`še ${days} dni`, sk:`ešte ${days} dní`, ro:`mai ${days} zile`,
    pl:`jeszcze ${days} dni`, ru:`ещё ${days} дней`, it:`ancora ${days} giorni`,
  }
  return m[lang] || m.de
}

/**
 * Generiert einen Google Calendar Link für eine Frist
 */
export function googleCalendarLink(params: {
  title: string
  deadlineDate: Date
  description: string
  lang: string
}): string {
  const { title, deadlineDate, description, lang } = params

  // Reminder 2 Tage vorher
  const reminderDate = new Date(deadlineDate)
  reminderDate.setDate(reminderDate.getDate() - 2)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const prefixes: Record<string, string> = {
    de: '⏰ Frist AmtsKlar:', en: '⏰ Deadline AmtsKlar:',
    tr: '⏰ Son tarih AmtsKlar:', it: '⏰ Scadenza AmtsKlar:',
    ru: '⏰ Срок AmtsKlar:', pl: '⏰ Termin AmtsKlar:',
    hr: '⏰ Rok AmtsKlar:', sr: '⏰ Rok AmtsKlar:',
    hu: '⏰ Határidő AmtsKlar:', sl: '⏰ Rok AmtsKlar:',
    sk: '⏰ Termín AmtsKlar:', ro: '⏰ Termen AmtsKlar:',
  }

  const prefix = prefixes[lang] || prefixes.de
  const calTitle    = encodeURIComponent(`${prefix} ${title}`)
  const calDesc     = encodeURIComponent(`${description}\n\nAnalysiert mit AmtsKlar — www.amtsklar.at`)
  const startDate   = fmt(reminderDate)
  const endDate     = fmt(deadlineDate)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${startDate}/${endDate}&details=${calDesc}`
}
