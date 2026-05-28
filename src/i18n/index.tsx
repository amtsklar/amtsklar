import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { LangCode, Translation, translations, langs } from './translations';

export { langs, type LangCode };
export type { Translation };

interface LangCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: Translation;
}

const Ctx = createContext<LangCtx>({ lang: 'de', setLang: () => {}, t: translations.de });

function getStored(): LangCode {
  try {
    const v = localStorage.getItem('ak_lang') as LangCode;
    return translations[v] ? v : 'de';
  } catch { return 'de'; }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(getStored);

  const value = useMemo<LangCtx>(() => ({
    lang,
    setLang: (l: LangCode) => {
      try { localStorage.setItem('ak_lang', l); } catch {}
      setLangState(l);
    },
    t: translations[lang],
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
