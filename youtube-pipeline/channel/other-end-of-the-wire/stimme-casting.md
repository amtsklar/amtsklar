# Stimmen-Casting „The Hidden Grid“ (Kauf: heute)

Die Stimme ist das Markenzeichen des Kanals. Sie wird **einmal** gewählt und dann nie mehr gewechselt (Wechsel = Bruch der Wiedererkennung).

## Warum nicht die jetzige Entwurfsstimme (en-US-GuyNeural)
- Gratis-Weg (edge-tts) ist für Veröffentlichung nicht lizenziert.
- Guy/Andrew/Brian gehören zu den meistgenutzten KI-Stimmen auf YouTube. Viele Zuschauer erkennen sie als „KI-Kanal-Stimme“. Das bedeutet null Wiedererkennung und eher den Eindruck von Massenware.

## Kriterien (jede Kandidatin / jeder Kandidat wird darauf bewertet, 1–5)
1. **Unverwechselbar:** Erkennt man sie nach 3 Sekunden wieder, auch ohne Bild?
2. **Vertrauen:** klingt wie ein ruhiger Ingenieur oder Erzähler, nicht wie Werbung
3. **Zahlen und Fachwörter:** „345,000 volts“, „uranium-235“, „round-trip efficiency“ ohne Holpern
4. **Wärme und Neugier:** trägt Fragen und kleine Pointen („Same wall, same wires.“)
5. **Durchhaltevermögen:** 9 Minuten ohne Ermüdung, auch bei +2 % Tempo in Shorts
6. **Exklusivität:** möglichst nur wir (eigene oder entworfene Stimme statt Bibliotheksstimme)
7. **Lizenz:** kommerzielle Nutzung auf YouTube ausdrücklich erlaubt, auch nach Kündigung für bereits veröffentlichte Videos

## Optionen
| Option | Wiedererkennung | Exklusiv | Bemerkung |
|---|---|---|---|
| ElevenLabs: eigene Stimme per *Voice Design* | hoch | ja | Stimme aus Beschreibung erzeugt, gehört dem Konto |
| ElevenLabs: Bibliotheksstimme | mittel | nein | andere Kanäle nutzen sie evtl. auch |
| Professioneller US-Sprecher, Stimme mit seiner Lizenz geklont | sehr hoch | ja | teurer, Vertrag nötig, menschlich = stärkste Marke |
| Azure Speech (Guy, Andrew …) | niedrig | nein | günstig, lizenziert, aber generisch |

**Empfehlung:** ElevenLabs bezahlt (Creator-Stufe oder höher, kommerzielle Lizenz). 3–4 Stimmen per Voice Design erzeugen und mit dem Testskript unten vergleichen. Die Bedingungen (kommerzielle Nutzung, was nach einer Kündigung gilt) vor dem Kauf auf der aktuellen Preisseite prüfen.

Beschreibung für Voice Design (Startpunkt):
> American male, late 30s to 40s, warm baritone, calm and curious, slight smile in the voice, clear articulation, documentary narrator who explains engineering to friends, no announcer tone.

Weibliche Gegenprobe (zum Vergleich, hebt sich bei Energie-Kanälen oft ab):
> American female, 30s to 40s, warm mid-low voice, calm, precise, quietly enthusiastic, science documentary narrator, not salesy.

## Testskript (ca. 40 s, mit allen Schwierigkeiten)
> Plug in your phone at 3 a.m. Then plug it in again at 3 p.m. Same wall, same wires. But the power behind them? Completely different.
> A uranium-235 atom absorbs a slow-moving neutron and splits. That heat travels at 345,000 volts across a hundred miles in under a thousandth of a second.
> Put 100 units of electricity in. Get about 28 back. That's the hydrogen round trip.
> This is The Hidden Grid. Follow the electron.

## Ablauf heute
1. Konto kaufen. **Den API-Key nicht in den Chat schreiben**: Ich öffne ein sicheres Formular, und der Key wird in der Umgebung gespeichert.
2. Ich erzeuge das Testskript mit 3–4 Kandidaten und lege sie als MP3 nebeneinander, danach entscheidest du mit Kopfhörern.
3. Gegenprobe mit einem zweiten Agenten (US-Marketer): Welche Stimme bleibt hängen, welche wirkt generisch?
4. Gewinnerstimme in `brand.json` festschreiben (`tts`, `voice`, `voice_locked: true`), alle 4 Videos und 8 Shorts neu vertonen.
5. **Signatur:** Jedes Video beginnt mit derselben Stimme und endet mit „Follow the electron.“ plus dem eigenen Musik-Sting. Stimme, Satz und Ton zusammen bilden die akustische Marke.
