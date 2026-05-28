# AmtsKlar 🇦🇹

**Österreichische Behördenbriefe sofort verstehen — KI-Analyse in 12 Sprachen**

Betreiber: Philipp Hofer · Fischerweg 7 · 9434 Au · Schweiz  
Website: https://amtsklar.at

---

## 🌍 Sprachen
🇦🇹 DE · 🇬🇧 EN · 🇹🇷 TR · 🇷🇸 SR · 🇭🇷 HR · 🇭🇺 HU · 🇸🇮 SL · 🇸🇰 SK · 🇷🇴 RO · 🇵🇱 PL · 🇷🇺 RU · 🇮🇹 IT

---

## 💰 API-Kosten (optimiert)
- Modell: **claude-haiku-4-5** (günstigste Option)
- System-Prompt: ~85 Tokens (statt 400+)
- Max. Output: 700 Tokens
- **Geschätzte Kosten: ~0,3–0,5 Cent pro Analyse** ✅

---

## 🚀 Setup

### 1. GitHub — Repository erstellen
Alle Dateien in ein neues GitHub Repository hochladen.

### 2. Cloudflare Pages verbinden
- cloudflare.com → Pages → GitHub Repository verbinden  
- Build-Befehl: `npm run build`  
- Output-Verzeichnis: `dist`

### 3. Environment Variables (Secrets) in Cloudflare
Settings → Environment Variables → Production:

| Variable | Wert |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| `PADDLE_API_KEY` | `pdl_live_...` |
| `PADDLE_WEBHOOK_SECRET` | aus Paddle Dashboard |

### 4. Paddle Price IDs eintragen
In `src/pages/Analyse.tsx` Zeile 13–14:
```ts
basic: 'pri_XXXXX',   // ← deine Basic Price ID
pro:   'pri_YYYYY',   // ← deine Pro Price ID
```

### 5. Domain verbinden (nach Paddle-Freigabe)
- World4You: DNS → CNAME `www` → `amtsklar.pages.dev`
- Cloudflare Pages: Custom Domain → `amtsklar.at`

---

## 📁 Dateistruktur
```
amtsklar/
├── functions/api/
│   ├── analyse.ts        ← KI-Analyse (Haiku, ~0,3ct/Anfrage)
│   ├── verify.ts         ← Paddle Abo-Prüfung
│   └── paddle.ts         ← Paddle Webhooks
├── src/
│   ├── components/
│   │   └── LanguageSwitcher.tsx   ← Dropdown für 12 Sprachen
│   ├── i18n/
│   │   ├── index.tsx              ← Language Context (optimiert)
│   │   └── translations.ts        ← Alle 12 Sprachen in 1 Datei
│   ├── pages/
│   │   ├── Landing.tsx            ← Startseite
│   │   ├── Analyse.tsx            ← App (lazy PDF, compressed images)
│   │   └── legal/
│   │       ├── Impressum.tsx      ← § 5 ECG + Art. 3 UWG
│   │       ├── Datenschutz.tsx    ← DSGVO + CH DSG
│   │       └── AGB.tsx            ← Schweizer Recht, EU-Widerrufsrecht
│   ├── App.tsx       ← Router (legal pages lazy-loaded)
│   ├── main.tsx      ← Entry + Suspense
│   └── index.css     ← Minimal reset
├── public/favicon.svg
├── index.html
├── package.json
├── vite.config.ts    ← Chunk splitting (vendor separate)
├── wrangler.toml
└── tsconfig.json
```

---

## ⚡ Optimierungen
- React.lazy() für Legal-Seiten
- Chunk splitting (vendor bundle)
- Images: max 1200px, JPEG 72% vor API-Übergabe
- PDF-Text: direkt als Text (keine Vision-Tokens)
- System-Prompt: 85 statt 400+ Tokens
- useCallback überall — keine unnötigen Re-renders
- Style-Konstanten außerhalb Komponenten — kein Re-create
