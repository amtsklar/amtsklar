#!/usr/bin/env python3
"""After a re-voice: copy the new English timestamps onto the translated captions
(same text -> same cue split). Refuses if the cue counts differ.
Usage: python3 pipeline/retime_captions.py projects/<name>"""
import re, sys
from pathlib import Path
TS = re.compile(r"\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}")
rel = Path(sys.argv[1]) / "release"
en = TS.findall((rel / "captions.srt").read_text())
for f in sorted(rel.glob("captions.*.srt")):
    if f.name in ("captions.srt", "captions.en_old.srt"):
        continue
    txt = f.read_text()
    old = TS.findall(txt)
    if len(old) != len(en):
        print("SKIP (cue count differs)", f.name, len(old), len(en)); continue
    it = iter(en)
    f.write_text(TS.sub(lambda m: next(it), txt))
    print("retimed", f.name, len(en))
