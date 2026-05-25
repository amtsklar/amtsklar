# AmtsKlar — Setup Guide
Österreichische Behördenbriefe sofort verstehen.
**Tech:** React + Vite + Cloudflare Pages + Cloudflare Functions + Paddle

---

## ✅ Was wirklich kostenlos ist (verifiziert)

| Service | Kosten | Einschränkung |
|---------|--------|---------------|
| **GitHub** | Gratis | Keine |
| **Cloudflare Pages** | Gratis auch kommerziell | 500 Deploys/Monat |
| **Cloudflare Functions** | Gratis | 100.000 Requests/Tag |
| **Paddle** | Keine Setup-Kosten | 5% + €0,50 pro Transaktion |
| **Anthropic API** | ~$5 Startguthaben | Danach pay-as-you-go |

**Monatliche Fixkosten:** ~€0 bis zu großem Traffic

---

## 🚀 Setup in 5 Schritten

### Schritt 1: GitHub Account + Repository
1. github.com → Sign up (kostenlos, keine Kreditkarte)
2. Neues Repository erstellen: "amtsklar"
3. Diesen Ordner hochladen (alle Dateien)

### Schritt 2: Cloudflare Account
1. cloudflare.com → Sign up (kostenlos, keine Kreditkarte)
2. Workers & Pages → Create application → Pages
3. Connect to Git → dein GitHub Repo wählen
4. Build settings:
   - Framework preset: **None** (oder Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
5. → Save and Deploy

### Schritt 3: Anthropic API Key
1. console.anthropic.com → Sign up
2. Telefonnummer verifizieren → ~$5 Gratisguthaben erscheint automatisch
3. Settings → API Keys → Create Key → kopieren
4. **Kreditkarte erst nötig wenn $5 aufgebraucht sind**

### Schritt 4: Paddle Account
1. vendors.paddle.com → Sign up
2. Firmendaten eingeben (kanadische LLP):
   - Business type: Limited Liability Partnership
   - Country: Canada
   - Firmendokumente hochladen (Registrierungsurkunde)
3. Warten auf KYB-Verifikation (2-4 Werktage)
4. Nach Verifikation:
   - Catalog → Products → Add Product → "AmtsKlar Monatsabo"
   - Add Price → Recurring → €2,99 → Monthly
   - Price ID notieren: `pri_01...`
5. Developer Tools → Authentication:
   - API Key (Secret) kopieren
   - Client-side token kopieren
6. Developer Tools → Webhooks:
   - Add webhook: `https://amtsklar.at/api/paddle`
   - Events: subscription.created, subscription.canceled, subscription.past_due, transaction.completed
   - Webhook secret kopieren

### Schritt 5: Keys in Cloudflare eintragen
1. Cloudflare Dashboard → dein Projekt → Settings → Environment Variables
2. Diese Variables hinzufügen (Type: Secret):

```
ANTHROPIC_API_KEY     = sk-ant-...
PADDLE_API_KEY        = ...
PADDLE_WEBHOOK_SECRET = ...
```

3. Diese Variables hinzufügen (Type: Plain text):
```
VITE_PADDLE_CLIENT_TOKEN = live_...
VITE_PADDLE_PRICE_ID     = pri_01...
```

4. → Save → Redeploy

---

## 🌐 Domain verbinden

1. In Cloudflare Pages → dein Projekt → Custom domains → Add domain
2. "amtsklar.at" eingeben
3. Cloudflare zeigt dir DNS-Einträge
4. In world4you (Domain-Registrar) die Nameserver ändern auf:
   ```
   jule.ns.cloudflare.com
   lloyd.ns.cloudflare.com
   ```
   (Cloudflare gibt dir die genauen Namen)
5. Warten 1-24 Stunden → Domain aktiv

---

## 💻 Lokal entwickeln

```bash
npm install
cp .env.example .env.local
# .env.local mit deinen Keys füllen
npm run dev
```

→ http://localhost:5173

---

## 📁 Projektstruktur

```
amtsklar/
├── functions/              # Cloudflare Pages Functions (Server-Side, gratis)
│   └── api/
│       ├── analyse.ts      → /api/analyse  (Anthropic API)
│       ├── verify.ts       → /api/verify   (Paddle Abo prüfen)
│       └── paddle.ts       → /api/paddle   (Paddle Webhooks)
├── public/
│   ├── _redirects          # SPA Routing
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── Landing.tsx     # Marketing-Seite
│   │   └── Analyse.tsx     # Die App + Paywall
│   ├── App.tsx             # Router
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── wrangler.toml           # Cloudflare Config
└── .env.example
```

---

## 💰 Kostenübersicht

| Was | Kosten/Monat |
|-----|-------------|
| Cloudflare Pages + Functions | **€0** (wirklich gratis, auch kommerziell) |
| GitHub | **€0** |
| Anthropic API (100 User × 5 Analysen) | **~€1** |
| Paddle (5% + €0,50 pro €2,99) | **~14% des Umsatzes** |
| Domain amtsklar.at | **€1,67** (€20/Jahr) |
| **Total bei 100 Usern** | **~€7 Kosten / ~€243 Umsatz** |

Break-Even: **3 zahlende User** decken alle Fixkosten.

---

## ⚠️ Wichtige Hinweise

1. **Anthropic API**: Kreditkarte erst nötig wenn ~$5 Gratisguthaben aufgebraucht. Danach pay-as-you-go (~€0,01 pro Analyse).

2. **Paddle KYB**: Firmendokumente der kanadischen LLP bereithalten. Registrierungsurkunde als PDF.

3. **Cloudflare Functions**: 100.000 Requests/Tag gratis = ca. 3 Millionen Anfragen/Monat. Für den Start mehr als genug.

4. **Paddle Sandbox**: Zum Testen sandbox.paddle.com verwenden. Echte Zahlungen erst über vendors.paddle.com.
