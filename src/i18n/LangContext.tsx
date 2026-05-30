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

import { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { translations, type LangCode, type T } from './translations'

export type { LangCode, T }

interface Ctx { lang: LangCode; setLang: (l: LangCode) => void; t: T }

const LangCtx = createContext<Ctx>({ lang:'de', setLang:()=>{}, t: translations.de })

function stored(): LangCode {
  try {
    const v = localStorage.getItem('ak_lang') as LangCode
    return translations[v] ? v : 'de'
  } catch { return 'de' }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(stored)

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang: (l: LangCode) => {
      try { localStorage.setItem('ak_lang', l) } catch {}
      setLangState(l)
    },
    t: translations[lang],
  }), [lang])

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
