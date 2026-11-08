#!/usr/bin/env python3
"""Corporate-identity gate: every video/short must match channel/the-hidden-grid/brand.json.
Usage: python3 pipeline/brand_check.py projects/<name> [projects/<name> ...] | shorts/<name>
Exit code 1 if anything fails (run before every upload)."""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "channel" / "the-hidden-grid" / "brand.json").read_text())


def dur(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True)
    return float(r.stdout or 0)


def check(path):
    path = Path(path).resolve()
    errs, warns = [], []
    short = (path / "short.json").exists()
    cfg = json.loads((path / ("short.json" if short else "scenes.json")).read_text())
    ok = lambda c, m: None if c else errs.append(m)
    ok(cfg.get("voice") == BRAND["voice"], f"voice {cfg.get('voice')} != {BRAND['voice']}")
    ok(cfg.get("rate") == BRAND["rate_short" if short else "rate_long"], f"rate {cfg.get('rate')}")
    text = " ".join(s["text"] for s in cfg["scenes"])
    for w in BRAND["forbidden_in_script"]:
        if w.lower() in text.lower():
            warns.append(f"phrase '{w.strip()}' in script")
    if short:
        ok(BRAND["short_outro_contains"] in cfg["scenes"][-1]["text"], "short outro missing channel mention")
        v = path / "build" / "short.mp4"
        if v.exists():
            d = dur(v); lo, hi = BRAND["length_short_seconds"]
            ok(lo <= d <= hi, f"short length {d:.1f}s outside {lo}-{hi}")
    else:
        ok(cfg.get("channel") == BRAND["channel"], "channel name")
        ok(cfg["scenes"][-1]["text"] == BRAND["outro"], "outro text differs from brand outro")
        words = len(text.split()); lo, hi = BRAND["words_long"]
        if not lo <= words <= hi:
            warns.append(f"{words} words (target {lo}-{hi})")
        ch = sum(1 for s in cfg["scenes"] if s.get("chapter")); lo, hi = BRAND["chapters"]
        ok(lo <= ch <= hi, f"{ch} chapters")
        gr = sum(1 for s in cfg["scenes"] if s.get("graphic"))
        ok(gr >= BRAND["graphics_min"], f"only {gr} own graphics")
        for s in cfg["scenes"]:
            if s.get("overlay") and s["overlay"] != s["overlay"].upper():
                errs.append(f"overlay not upper case: {s['overlay']}")
        desc = cfg.get("meta", {}).get("description", "")
        for dsc in BRAND["disclosures"]:
            ok(dsc in desc, f"disclosure missing: {dsc[:40]}")
        b = path / "build"
        if (b / "video.mp4").exists():
            d = dur(b / "video.mp4"); lo, hi = BRAND["length_long_seconds"]
            ok(lo <= d <= hi, f"length {d:.0f}s outside {lo}-{hi}")
        rel = path / "release"
        if (rel / "metadata.md").exists():
            m = re.search(r"## Description\n\n```\n(.*?)```", (rel / "metadata.md").read_text(), re.S)
            if m:
                ok(len(m.group(1)) <= BRAND["description_max_chars"], f"description {len(m.group(1))} chars")
        for lang in BRAND["caption_languages"]:
            f = rel / ("captions.srt" if lang == "en" else f"captions.{lang}.srt")
            if not f.exists():
                warns.append(f"captions {lang} missing")
        en = rel / "captions.srt"
        if en.exists():
            n_en = (en.read_text().count(" --> "))
            for lang in BRAND["caption_languages"][1:]:
                f = rel / f"captions.{lang}.srt"
                if f.exists() and f.read_text().count(" --> ") != n_en:
                    errs.append(f"captions {lang}: cue count differs from English")
    status = "FAIL" if errs else "OK"
    print(f"[{status}] {path.name}")
    for e in errs:
        print("   ERROR:", e)
    for w in warns:
        print("   warn: ", w)
    return not errs


if __name__ == "__main__":
    good = all([check(p) for p in sys.argv[1:]])
    sys.exit(0 if good else 1)
