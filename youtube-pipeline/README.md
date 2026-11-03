# YouTube-Pipeline (Faceless-Videos für ROOTED)

Aus einem Skript (`scenes.json`) entsteht automatisch ein upload-fertiges Video in 1080p, nur mit kostenlosen Werkzeugen.

| Stufe | Was passiert | Werkzeug |
|---|---|---|
| `voice` | Sprecherstimme je Szene, Pausen, Untertitel (`captions.srt`) | edge-tts (kostenlos) |
| `images` | Passende Videoclips und Fotos je Szene, Quellen werden mitgeschrieben | Pexels (mit `PEXELS_API_KEY`), sonst Openverse |
| `render` | Schwenks über Fotos, echte Clips, Kapiteltitel, Lautheit auf YouTube-Norm | ffmpeg |
| `thumbs` | Thumbnail-Varianten (1280×720) | Pillow |
| `meta` | Titelvarianten, Beschreibung mit Kapitelmarken, Tags, Upload-Checkliste | – |

## Ablauf

```bash
pip install edge-tts pillow certifi
export PEXELS_API_KEY=...            # kostenlos auf pexels.com/api
python3 pipeline/make_video.py projects/fall-leaves-black-gold          # alle Stufen
python3 pipeline/make_video.py projects/fall-leaves-black-gold render   # nur eine Stufe
```

Ergebnis in `projects/<name>/build/`: `video.mp4`, `captions.srt`, `thumbnails/`, `metadata.md`.

## Neues Video

1. Ordner `projects/<thema>/` anlegen und `scenes.json` nach dem Muster von `fall-leaves-black-gold` schreiben. Jede Szene braucht `text` (Sprechtext) und `query` (Bildsuche). Optional sind `chapter` (Kapitelmarke), `overlay` (Einblendung) und `fallback` (weitere Suchbegriffe).
2. Das Skript durchläuft das Agenten-Team: Analyst → Rechercheur → Autor → Kritiker. Erst danach kommt die Pipeline.
3. Ein Mensch prüft das fertige Video und lädt es hoch.

Schrift: Anton (SIL Open Font License).
