# Projekt: Faceless-YouTube-Videos für ROOTED

Du hilfst Martin und Ursula, für ihren YouTube-Kanal **ROOTED** (@Getrootedhere) upload-fertige Videos zu produzieren. Am Ende steht immer eine fertige Datei. **Hochladen tut ein Mensch.**

## Der Kanal
- US-Gartenkanal in **US-Englisch** für amerikanische Hobbygärtner: alte Gartenmethoden, Bodenaufbau, Kompost, Selbstversorgung, Heilpflanzen, alles kostenlos oder günstig.
- Rund 1.150 Abonnenten (Stand November 2026), die meisten Videos haben 30–1.500 Aufrufe.
- Vorbild für Format und Titel: **Happy Harvest 2** (@happyharvest2-k6j), ein deutscher Gartenkanal mit 8–9-Minuten-Videos und Neugier-Titeln („NUR 1 LÖFFEL…“, „WARNUNG!…“).
- Strategie: **Format übernehmen, Inhalt besser machen.** Gleiche Länge und Neugier-Mechanik, aber ehrliche, überprüfbare Tipps.

## Spielregeln (immer einhalten)
1. **Inspirieren, nicht kopieren.** Muster von Vorbildern ja. Deren Skripte, Bilder oder Clips nie übernehmen (Urheberrecht, „reused content“).
2. **Ehrlich statt übertrieben.** Neugierige Titel ja, falsche Versprechen nein. Jede Faktenbehauptung braucht eine Quelle (Universität, Extension Service, Behörde).
3. **Menschlich klingen.** Kein generisches KI-Englisch („let's dive in“, „game-changer“). Warm, leicht bodenständig, amerikanische Alltagsbeispiele (Fahrenheit, Gallonen, Fuß/Zoll, USDA-Zonen).
4. **Länge:** fertiges Video mindestens 8:30 Minuten (ca. 1.400–1.550 Wörter bei Sprechtempo -8 %).
5. **Bildmaterial:** zuerst **eigenes Material** von Martin und Ursula, dann Pixabay, dann Wikimedia Commons. Jedes Bild wird vor dem Rendern gesichtet. Unpassendes fliegt raus (Tiere, die nicht zum Thema gehören, Texttafeln, Kitsch, Menschen-Posen).
6. **KI-Kennzeichnung:** Die Stimme ist synthetisch. Beim Upload die Frage nach „altered or synthetic content“ ehrlich beantworten.
7. Nichts veröffentlichen, posten oder per Mail verschicken ohne ausdrückliches OK.

## Ablauf für ein neues Video (Agenten-Team in `.claude/agents/`)
1. **analyst**: erfolgreiche Videos von ROOTED und Vorbildern zum Thema auswerten → Themenwinkel, Hook, Titelmuster
2. **researcher**: Fakten mit Quellen sammeln → Faktenblatt
3. **scriptwriter**: `projects/<thema>/scenes.json` schreiben (Szenen mit `text`, `query`, optional `chapter`, `overlay`, `fallback`)
4. **critic**: Faktencheck, KI-Floskeln, Spannungsbogen, Länge → konkrete Korrekturen, danach einarbeiten
5. Pipeline-Stufe `voice` → Länge prüfen (Ziel ≥ 8:30)
6. Pipeline-Stufe `images` → **editor** sichtet Kontaktbögen, löscht Ausreißer, lässt mit besseren Suchbegriffen nachladen
7. Pipeline-Stufen `render`, `thumbs`, `meta`
8. **seo**: Titel, Beschreibung, Tags, Thumbnail-Texte prüfen
9. Mensch schaut das ganze Video an → Upload in YouTube Studio

## Pipeline
```bash
python pipeline/make_video.py projects/<thema>                 # alle Stufen
python pipeline/make_video.py projects/<thema> voice            # einzelne Stufe
```
Stufen: `voice` (edge-tts, Stimme en-US-AndrewNeural, Tempo -8 %) · `images` (Pixabay bei gesetztem `PIXABAY_API_KEY`, mit `IMAGE_SOURCE=wikimedia` Wikimedia) · `pool`/`assign` (Material-Pool) · `render` (ffmpeg, 1080p, -14 LUFS) · `thumbs` (1280×720) · `meta` (metadata.md mit Titeln, Beschreibung, Kapiteln, Tags, Bildnachweisen).
Ergebnis: `projects/<thema>/build/` (video.mp4, captions.srt, thumbnails/, metadata.md). Vorlage und Beispiel: `projects/fall-leaves-black-gold/`.

Kontaktbogen zum Sichten: Aus `build/images/` ein Raster aus Vorschaubildern bauen (bei .mp4 ein Standbild nach 2 s), Dateinamen einblenden, ansehen, schlechte Dateien löschen, pro Szene neu durchnummerieren, `images` erneut laufen lassen.

## Geplant: eigene Clip-Bibliothek
Martin und Ursula haben rund 100 eigene Videos auf ihrem Windows-PC. Ziel ist eine neue Stufe `library`:
1. Videos mit ffmpeg-Szenenerkennung (`select='gt(scene,0.3)'`) oder PySceneDetect in Clips von 3–15 s schneiden.
2. Von jedem Clip ein Vorschaubild ziehen, sichten, verschlagworten (z. B. compost, leaves, hands-soil, tomatoes), Unbrauchbares aussortieren.
3. Einen Katalog `library/catalog.json` anlegen. Die Stufe `images` sucht zuerst darin, erst danach bei Pixabay.
4. Optional mit Whisper das Gesprochene der alten Videos transkribieren, damit Clips auch nach Inhalt findbar sind.
Anfangs 10–20 Videos, Rest über Nacht.

## Technik-Hinweise (Windows)
- Python heißt unter Windows meist `python` oder `py`, nicht `python3`.
- ffmpeg muss im PATH sein (`ffmpeg -version`).
- Der Pixabay-Key steht in der Umgebungsvariable `PIXABAY_API_KEY`. Niemals in Dateien oder in den Chat schreiben.
- Große Dateien (Videos, build/) gehören nicht ins Git-Repo.

## Other End of the Wire (vormals The Hidden Grid): feste Regeln (seit Nov. 2026)
- **Eigener Kanal von Philipp, komplett getrennt von ROOTED.** Nichts aus der Garten-Vorlage übernehmen: keine ROOTED-Farben (Grün), keine Garten-Defaults, keine ROOTED-Längen- oder Stimmregeln. Es gilt nur `brand.json`.
- **Freigabe vor Serienproduktion:** Änderungen an Ton, Bild oder Stil erst an *einem* Video zeigen; die anderen Videos werden erst nach Philipps Freigabe neu gerendert.
- **Corporate Identity:** verbindlich in `channel/other-end-of-the-wire/brand.json` (Stimme, Tempo, Abspann, Farben, Schriften, Längen, Disclosures). Vor jedem Upload `python3 pipeline/brand_check.py projects/<name>` (bzw. `shorts/<name>`); bei FAIL wird nicht hochgeladen.
- **Sprach-Gegencheck bei jeder Übersetzung:** ein *zweiter*, unabhängiger Agent prüft jede Sprache (Grammatik, Satzstellung, Zeichensetzung, Fachbegriffe, Zahlen/Einheiten, Lesegeschwindigkeit max. ~17 Zeichen/s, Zeitmarken identisch zum Englischen). Erst danach gilt eine Übersetzung als fertig. Auch das englische Original wird so geprüft.
- **Vorrat statt Vorproduktion:** höchstens 2–3 fertige Videos auf Vorrat (Puffer für Ausfälle). Nach jedem Upload die Zahlen aus YouTube Studio (CTR, Zuschauerbindung, Absprungstellen) in `channel/other-end-of-the-wire/learnings.md` eintragen; die Learnings fließen ins *nächste* Skript. Vorratsvideos werden vor dem Upload an neue Learnings angepasst (Titel, Thumbnail, Hook, ggf. Neurender – kostet nur Rechenzeit).
- **Experten-Panel bei jedem Video (Vier-Augen-Prinzip):** Kein Video geht ohne unabhängige Zweitprüfung raus. Pro Video prüfen getrennte Agenten: (1) **Wissenschaftler** – Fakten, Physik, Einheiten, Grafiken gegen Primärquellen; (2) **US-YouTube-Marketer** – Titel, Thumbnail, Hook, Shorts, Upload-Zeitpunkt; (3) **Compliance-Prüfer** – YouTube-Richtlinien, KI-Kennzeichnung, Lizenzen, Interessenkonflikt; (4) **Sprachprüfer** je Sprache. Ihre Befunde werden eingearbeitet, bevor `brand_check.py` und `qc.py` laufen.
- **Länge:** gilt `brand.json` (520–600 s inkl. 12 s Endbildschirm, 1.150–1.260 Wörter), nicht die ROOTED-Regel von 8:30.
- **Medien:** kein Clip in zwei Videos des Kanals; Logos/Marken/Off-Topic dauerhaft in `channel/other-end-of-the-wire/blocked_media.json`.
- **Stimme = Markenprodukt:** ist festgelegt: **„OEW Narrator F1“** (ElevenLabs, eigene Voice-Design-Stimme, `voice` in brand.json, `voice_locked: true`). Wird nie gewechselt. Der API-Schlüssel wird vom Netzwerk-Proxy eingefügt, er steht nirgends im Code.
- **Darf nicht nach KI aussehen oder klingen:** keine KI-generierten Bilder oder Videos (nur echtes Stockmaterial und eigene Datengrafiken), keine KI-Floskeln (Liste in brand.json plus „delve“, „tapestry“, „unlock“, „in a world where“, „let's break it down“), Sätze mit wechselnder Länge, konkrete US-Alltagsbeispiele, eigene Recherche-Momente („We ran the numbers…“), Thumbnails mit echten Fotos oder eigenen Charts statt glatter KI-Optik, Stimme mit natürlichen Pausen und Betonung. Ein Prüf-Agent hört und liest jedes Video zusätzlich mit der Frage: „Würde ein US-Zuschauer das für KI-Massenware halten?“
- **QC:** `python3 pipeline/qc.py projects/<name> <ausgabeordner>` (Technik + 3 Standbilder je Szene gegen den Sprechtext) nach jedem Rendern.
