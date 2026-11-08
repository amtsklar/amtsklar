#!/usr/bin/env python3
"""Faceless YouTube video pipeline.

Usage:
    python3 pipeline/make_video.py projects/<name> [voice] [images] [render] [thumbs] [meta]
    (no stage given = run all stages in order)

Input:  projects/<name>/scenes.json   (script split into scenes, see README)
Output: projects/<name>/build/        (audio, images, clips, final video.mp4,
                                       captions.srt, thumbnails, metadata.md)
Only free tools: edge-tts (voice), Openverse (CC-licensed images), ffmpeg, Pillow.
"""
import asyncio
import json
import math
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "assets" / "Anton-Regular.ttf"
W, H, FPS = 1920, 1080, 30
CLIP_MAX = 7.0          # seconds per image before cutting to the next one
GAP = 0.35              # pause between scenes (s)
CHAPTER_GAP = 0.8       # pause before a new chapter (s)
UA = "ROOTED-video-pipeline/1.0"

# The cloud sandbox routes HTTPS through a proxy with its own CA.
CA = "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):
    import certifi
    import ssl
    certifi.where = lambda: CA
    os.environ.setdefault("SSL_CERT_FILE", CA)
    ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=CA)


def sh(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def load(project):
    return json.loads((project / "scenes.json").read_text())


def build_dir(project):
    b = project / "build"
    b.mkdir(exist_ok=True)
    return b


# ---------------------------------------------------------------- voice
def _sentences_by_length(text, total):
    """Fallback caption timing: split into sentences, time proportional to length."""
    parts = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    n = sum(len(p) for p in parts) or 1
    t, out = 0.0, []
    for p in parts:
        d = total * len(p) / n
        out.append({"start": t, "end": t + d, "text": p})
        t += d
    return out


BRAND_FILE = ROOT / "channel" / "other-end-of-the-wire" / "brand.json"


def _tts_elevenlabs(text, voice_id, out, rate="+0%", prev="", nxt=""):
    """Licensed voice via ElevenLabs (key injected by the network proxy; plan with commercial licence).
    prev/next text keep intonation continuous across scene boundaries; rate '+2%' -> speed 1.02."""
    import base64
    brand = json.loads(BRAND_FILE.read_text()) if BRAND_FILE.exists() else {}
    vs = dict(brand.get("voice_settings", {}))
    m = re.match(r"([+-]?\d+)%", rate or "")
    vs["speed"] = max(0.7, min(1.2, 1 + (int(m.group(1)) if m else 0) / 100))
    body = json.dumps({"text": text, "model_id": brand.get("tts_model", "eleven_multilingual_v2"),
                       "voice_settings": vs, "previous_text": prev[-600:], "next_text": nxt[:300]}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128",
                                 data=body, method="POST",
                                 headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected"),
                                          "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.loads(r.read())
    Path(out).write_bytes(base64.b64decode(res["audio_base64"]))
    al = res.get("alignment") or {}
    chars, starts, ends = al.get("characters", []), al.get("character_start_times_seconds", []), \
        al.get("character_end_times_seconds", [])
    sentences, buf, s0 = [], "", None
    for c, a, e in zip(chars, starts, ends):
        if s0 is None and not c.isspace():
            s0 = a
        buf += c
        if c in ".!?" and s0 is not None:
            sentences.append({"start": s0, "end": e, "text": buf.strip()})
            buf, s0 = "", None
    if buf.strip() and s0 is not None:
        sentences.append({"start": s0, "end": ends[-1], "text": buf.strip()})
    return sentences


def _tts_azure(text, voice, rate, out):
    """Licensed voice via Azure Speech (env AZURE_SPEECH_KEY, AZURE_SPEECH_REGION)."""
    from xml.sax.saxutils import escape
    region = os.environ.get("AZURE_SPEECH_REGION", "westeurope")
    ssml = (f"<speak version='1.0' xml:lang='en-US'><voice name='{voice}'>"
            f"<prosody rate='{rate}'>{escape(text)}</prosody></voice></speak>").encode()
    req = urllib.request.Request(f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
                                 data=ssml, method="POST",
                                 headers={"Ocp-Apim-Subscription-Key": os.environ.get("AZURE_SPEECH_KEY", "proxy-injected"),
                                          "Content-Type": "application/ssml+xml",
                                          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
                                          "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        Path(out).write_bytes(r.read())
    return _sentences_by_length(text, duration(out))


async def _tts(text, voice, rate, out, engine="edge", prev="", nxt=""):
    if engine == "elevenlabs":
        return _tts_elevenlabs(text, voice, out, rate, prev, nxt)
    if engine == "azure":
        return _tts_azure(text, voice, rate, out)
    import edge_tts
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="SentenceBoundary")
    sentences = []
    with open(out, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] in ("SentenceBoundary", "WordBoundary"):
                sentences.append({"start": chunk["offset"] / 1e7,
                                  "end": (chunk["offset"] + chunk["duration"]) / 1e7,
                                  "text": chunk["text"]})
    return sentences


def split_cue(cue, max_words=11):
    words = cue["text"].split()
    if len(words) <= max_words:
        return [cue]
    n = math.ceil(len(words) / max_words)
    size = math.ceil(len(words) / n)
    parts = [words[i:i + size] for i in range(0, len(words), size)]
    total = sum(len(p) for p in parts)
    t, out = cue["start"], []
    for p in parts:
        d = (cue["end"] - cue["start"]) * len(p) / total
        out.append({"start": t, "end": t + d, "text": " ".join(p)})
        t += d
    return out


def stage_voice(project):
    cfg, b = load(project), build_dir(project)
    (b / "audio").mkdir(exist_ok=True)
    timeline, cues, t = [], [], 0.0
    for i, sc in enumerate(cfg["scenes"]):
        gap = (CHAPTER_GAP if sc.get("chapter") and i else GAP) if i else 0.0
        t += gap
        mp3 = b / "audio" / f"s{i:02d}.mp3"
        sentences = None
        for attempt in range(4):
            try:
                sc_all = cfg["scenes"]
                sentences = asyncio.run(_tts(sc["text"], cfg["voice"], cfg.get("rate", "+0%"), mp3,
                                             cfg.get("tts", "edge"),
                                             " ".join(x["text"] for x in sc_all[max(0, i - 2):i]),
                                             sc_all[i + 1]["text"] if i + 1 < len(sc_all) else ""))
                break
            except Exception as e:  # network hiccups
                print("  tts retry", i, e)
                time.sleep(2 ** attempt)
        d = duration(mp3)
        for s in sentences or [{"start": 0, "end": d, "text": sc["text"]}]:
            for c in split_cue(s):
                cues.append({"start": t + c["start"], "end": t + c["end"], "text": c["text"]})
        timeline.append({"i": i, "start": t, "gap": gap, "dur": d, "audio": str(mp3.relative_to(b))})
        t += d
        print(f"  voice s{i:02d} {d:5.1f}s")
    # assemble narration track with gaps
    parts = []
    for sc in timeline:
        if sc["gap"]:
            parts.append(f"anullsrc=r=24000:cl=mono:d={sc['gap']}")
    inputs, filt, idx = [], [], 0
    for sc in timeline:
        if sc["gap"]:
            filt.append(f"aevalsrc=0:d={sc['gap']}:s=24000[g{idx}]")
            idx += 1
    seq, gi = [], 0
    args = ["ffmpeg", "-y"]
    for n, sc in enumerate(timeline):
        args += ["-i", str(b / sc["audio"])]
    labels = []
    for n, sc in enumerate(timeline):
        if sc["gap"]:
            labels.append(f"[g{gi}]")
            gi += 1
        filt.append(f"[{n}:a]aresample=24000,aformat=channel_layouts=mono[a{n}]")
        labels.append(f"[a{n}]")
    filt.append("".join(labels) + f"concat=n={len(labels)}:v=0:a=1[out]")
    args += ["-filter_complex", ";".join(filt), "-map", "[out]", str(b / "voice.wav")]
    sh(*args)
    total = duration(b / "voice.wav")
    (b / "timeline.json").write_text(json.dumps({"total": total, "scenes": timeline}, indent=1))
    srt = []
    for n, c in enumerate(cues, 1):
        srt.append(f"{n}\n{_ts(c['start'])} --> {_ts(c['end'])}\n{c['text']}\n")
    (b / "captions.srt").write_text("\n".join(srt))
    print(f"voice: {total / 60:.2f} min, {len(cues)} caption cues")


def _ts(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


# ---------------------------------------------------------------- images
def http_get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def openverse(query, page_size=20):
    q = urllib.parse.urlencode({"q": query, "license_type": "commercial,modification",
                                "aspect_ratio": "wide", "size": "large",
                                "page_size": page_size, "mature": "false"})
    for attempt in range(4):
        try:
            return json.loads(http_get(f"https://api.openverse.org/v1/images/?{q}"))["results"]
        except Exception as e:
            print("  openverse retry", query, e)
            time.sleep(5 * (attempt + 1))
    return []


def cover(img, w=W, h=H):
    from PIL import Image
    img = img.convert("RGB")
    s = max(w / img.width, h / img.height)
    img = img.resize((math.ceil(img.width * s), math.ceil(img.height * s)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def pexels(kind, query, per_page=15):
    """kind = 'photos' or 'videos'. Needs env PEXELS_API_KEY (free at pexels.com/api)."""
    base = "https://api.pexels.com/v1/search" if kind == "photos" else "https://api.pexels.com/videos/search"
    q = urllib.parse.urlencode({"query": query, "orientation": "landscape", "per_page": per_page,
                                "size": "large" if kind == "photos" else "medium"})
    req = urllib.request.Request(f"{base}?{q}", headers={"Authorization": os.environ["PEXELS_API_KEY"],
                                                         "User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read())[kind]
        except Exception as e:
            print("  pexels retry", query, e)
            time.sleep(3 * (attempt + 1))
    return []


def stage_images_pexels(project):
    """Every scene gets one real video clip first, then photos. Pexels licence: free use, no attribution needed."""
    from PIL import Image
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())["scenes"]
    img_dir = b / "images"
    img_dir.mkdir(exist_ok=True)
    credits_path = b / "credits.json"
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {}
    used = {c["id"] for c in credits.values()}
    for i, sc in enumerate(cfg["scenes"]):
        need = max(1, math.ceil((tl[i]["dur"] + tl[i]["gap"]) / CLIP_MAX))
        have = sorted(img_dir.glob(f"s{i:02d}_*"))
        k = len(have)
        queries = list(dict.fromkeys([sc["query"]] + sc.get("fallback", []) + [" ".join(sc["query"].split()[-2:])]))
        if k == 0 and sc.get("video", True):
            for q in queries:
                for v in pexels("videos", q):
                    if f"v{v['id']}" in used or v["duration"] < 5:
                        continue
                    files = [f for f in v["video_files"] if f.get("width") and 1280 <= f["width"] <= 1920
                             and f["file_type"] == "video/mp4"]
                    if not files:
                        continue
                    f = max(files, key=lambda f: f["width"])
                    name = f"s{i:02d}_{k}.mp4"
                    try:
                        (img_dir / name).write_bytes(http_get(f["link"], 120))
                    except Exception as e:
                        print("  skip video", e)
                        continue
                    used.add(f"v{v['id']}")
                    credits[name] = {"id": f"v{v['id']}", "title": "Pexels video", "creator": v["user"]["name"],
                                     "license": "Pexels License", "url": v["url"], "query": q}
                    k += 1
                    break
                if k:
                    break
        for q in queries:
            if k >= need:
                break
            for p in pexels("photos", q):
                if k >= need:
                    break
                if f"p{p['id']}" in used:
                    continue
                try:
                    im = Image.open(BytesIO(http_get(p["src"]["large2x"], 40)))
                    name = f"s{i:02d}_{k}.jpg"
                    cover(im, 2560, 1440).save(img_dir / name, quality=90)
                except Exception as e:
                    print("  skip photo", e)
                    continue
                used.add(f"p{p['id']}")
                credits[name] = {"id": f"p{p['id']}", "title": p.get("alt"), "creator": p["photographer"],
                                 "license": "Pexels License", "url": p["url"], "query": q}
                k += 1
        credits_path.write_text(json.dumps(credits, indent=1))
        print(f"  media s{i:02d}: {k}/{need}  ({sc['query']})")


def pixabay(kind, query, per_page=20):
    """kind = 'photos' or 'videos'. Needs env PIXABAY_API_KEY (free at pixabay.com/api/docs)."""
    base = "https://pixabay.com/api/" if kind == "photos" else "https://pixabay.com/api/videos/"
    params = {"key": os.environ["PIXABAY_API_KEY"], "q": query[:100], "per_page": per_page,
              "safesearch": "true"}
    if kind == "photos":
        params.update({"image_type": "photo", "orientation": "horizontal", "min_width": 1600})
    else:
        params.update({"video_type": "film", "min_width": 1280})
    for attempt in range(3):
        try:
            return json.loads(http_get(f"{base}?{urllib.parse.urlencode(params)}"))["hits"]
        except Exception as e:
            print("  pixabay retry", query, e)
            time.sleep(3 * (attempt + 1))
    return []


def stage_images_pixabay(project):
    """Each scene: one real video clip first (if found), then photos. Pixabay licence: free use, no attribution."""
    from PIL import Image
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())["scenes"]
    img_dir = b / "images"
    img_dir.mkdir(exist_ok=True)
    credits_path = b / "credits.json"
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {}
    used = {c["id"] for c in credits.values()}
    if (b / "rejected.json").exists():
        used |= set(json.loads((b / "rejected.json").read_text()))
    blk = ROOT / "channel" / "other-end-of-the-wire" / "blocked_media.json"   # channel-wide: logos, brands, off-topic
    if blk.exists() and cfg.get("channel") == "Other End of the Wire":
        used |= set(json.loads(blk.read_text()))
    for other in project.parent.glob("*/build/credits.json"):   # never reuse a clip from another video of the channel
        if other.parent.parent == project:
            continue
        try:
            if json.loads((other.parent.parent / "scenes.json").read_text()).get("channel") == cfg.get("channel"):
                used |= {c.get("id") for c in json.loads(other.read_text()).values()}
        except Exception:
            pass
    for i, sc in enumerate(cfg["scenes"]):
        need = max(1, math.ceil((tl[i]["dur"] + tl[i]["gap"]) / CLIP_MAX))
        if (b / "graphics" / f"s{i:02d}.png").exists():
            continue                      # own chart/diagram replaces stock footage
        k = len(list(img_dir.glob(f"s{i:02d}_*")))
        queries = list(dict.fromkeys([sc["query"]] + sc.get("fallback", []) + [" ".join(sc["query"].split()[-2:])]))
        if k == 0 and sc.get("video", True):
            for q in queries:
                for v in pixabay("videos", q):
                    if f"v{v['id']}" in used or v.get("duration", 0) < 5:
                        continue
                    sizes = [f for f in v["videos"].values() if f.get("url") and 1280 <= f.get("width", 0) <= 1920]
                    if not sizes:
                        continue
                    f = max(sizes, key=lambda f: f["width"])
                    name = f"s{i:02d}_{k}.mp4"
                    try:
                        (img_dir / name).write_bytes(http_get(f["url"], 180))
                    except Exception as e:
                        print("  skip video", e)
                        continue
                    used.add(f"v{v['id']}")
                    credits[name] = {"id": f"v{v['id']}", "title": v.get("tags"), "creator": v.get("user"),
                                     "license": "Pixabay Content License", "url": v.get("pageURL"), "query": q}
                    k += 1
                    break
                if k:
                    break
        for q in queries:
            if k >= need:
                break
            for p in pixabay("photos", q):
                if k >= need:
                    break
                if f"p{p['id']}" in used:
                    continue
                try:
                    im = Image.open(BytesIO(http_get(p["largeImageURL"], 40)))
                    name = f"s{i:02d}_{k}.jpg"
                    cover(im, 2560, 1440).save(img_dir / name, quality=90)
                except Exception as e:
                    print("  skip photo", e)
                    continue
                used.add(f"p{p['id']}")
                credits[name] = {"id": f"p{p['id']}", "title": p.get("tags"), "creator": p.get("user"),
                                 "license": "Pixabay Content License", "url": p.get("pageURL"), "query": q}
                k += 1
        credits_path.write_text(json.dumps(credits, indent=1))
        print(f"  media s{i:02d}: {k}/{need}  ({sc['query']})")


WM_UA = "ROOTEDVideoPipeline/1.0 (https://github.com/amtsklar/amtsklar; educational workshop)"


def wm_get(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": WM_UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def wikimedia_search(query, limit=25):
    q = urllib.parse.urlencode({"q": f"{query} filetype:bitmap", "limit": limit})
    for attempt in range(3):
        try:
            return json.loads(wm_get(f"https://api.wikimedia.org/core/v1/commons/search/page?{q}"))["pages"]
        except Exception as e:
            print("  wikimedia retry", query, e)
            time.sleep(5 * (attempt + 1))
    return []


def wikimedia_thumb(file_key):
    """Standard-size thumbnail URLs (1920 then 1280) on upload.wikimedia.org."""
    import hashlib
    name = file_key.split(":", 1)[1].replace(" ", "_")
    h = hashlib.md5(name.encode()).hexdigest()
    enc = urllib.parse.quote(name)
    for w in (1920, 1280):
        yield f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{enc}/{w}px-{enc}"


def stage_images_wikimedia(project):
    """Free-licensed photos from Wikimedia Commons (CC BY / BY-SA / PD) - credits go in the description."""
    from PIL import Image
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())["scenes"]
    img_dir = b / "images"
    img_dir.mkdir(exist_ok=True)
    credits_path = b / "credits.json"
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {}
    used = {c["id"] for c in credits.values()}
    for i, sc in enumerate(cfg["scenes"]):
        need = max(1, math.ceil((tl[i]["dur"] + tl[i]["gap"]) / CLIP_MAX))
        k = len(list(img_dir.glob(f"s{i:02d}_*")))
        queries = list(dict.fromkeys([sc["query"]] + sc.get("fallback", []) + [" ".join(sc["query"].split()[-2:])]))
        for q in queries:
            if k >= need:
                break
            for page in wikimedia_search(q):
                if k >= need:
                    break
                key = page["key"]
                if key in used or not re.search(r"\.(jpe?g|png)$", key, re.I):
                    continue
                im = None
                for url in wikimedia_thumb(key):
                    try:
                        im = Image.open(BytesIO(wm_get(url)))
                        break
                    except Exception:
                        im = None
                if im is None or im.width < 1200 or im.width / im.height < 1.25:
                    continue
                name = f"s{i:02d}_{k}.jpg"
                cover(im, 2560, 1440).save(img_dir / name, quality=90)
                used.add(key)
                excerpt = re.sub(r"<[^>]+>", "", page.get("excerpt") or "")
                credits[name] = {"id": key, "title": page.get("title", "").removeprefix("File:"),
                                 "creator": "see file page", "license": "Wikimedia Commons (free licence)",
                                 "url": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(key),
                                 "excerpt": excerpt[:200], "query": q}
                k += 1
                credits_path.write_text(json.dumps(credits, indent=1))
                time.sleep(0.5)
        print(f"  media s{i:02d}: {k}/{need}  ({sc['query']})")


def stage_pool(project, per_tag=8):
    """Editor workflow: download candidate photos per topic (cfg['pool'] = {tag: query}) into build/pool/.
    A human/agent then reviews contact sheets and assigns them to scenes via scene['images']."""
    from PIL import Image
    cfg, b = load(project), build_dir(project)
    pool = b / "pool"
    pool.mkdir(exist_ok=True)
    cpath = b / "pool_credits.json"
    credits = json.loads(cpath.read_text()) if cpath.exists() else {}
    used = {c["id"] for c in credits.values()}
    for tag, query in cfg.get("pool", {}).items():
        k = len(list(pool.glob(f"{tag}_*.jpg")))
        if k >= per_tag:
            continue
        pages = []
        for attempt in range(5):
            try:
                q = urllib.parse.urlencode({"q": f"{query} filetype:bitmap", "limit": 40})
                pages = json.loads(wm_get(f"https://api.wikimedia.org/core/v1/commons/search/page?{q}"))["pages"]
                break
            except Exception as e:
                print("  wait (rate limit)", tag, e)
                time.sleep(20 * (attempt + 1))
        for page in pages:
            if k >= per_tag:
                break
            key = page["key"]
            if key in used or not re.search(r"\.(jpe?g|png)$", key, re.I):
                continue
            im = None
            for url in wikimedia_thumb(key):
                try:
                    im = Image.open(BytesIO(wm_get(url)))
                    break
                except Exception:
                    im = None
            if im is None or im.width < 1200 or im.width / im.height < 1.25:
                continue
            name = f"{tag}_{k}"
            cover(im, 2560, 1440).save(pool / f"{name}.jpg", quality=90)
            used.add(key)
            credits[name] = {"id": key, "title": page.get("title", "").removeprefix("File:"),
                             "url": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(key)}
            cpath.write_text(json.dumps(credits, indent=1))
            k += 1
        print(f"  pool {tag}: {k} ({query})")
        time.sleep(4)


def stage_assign(project):
    """Copy the reviewed pool photos listed in scene['images'] into build/images/ for rendering."""
    import shutil
    cfg, b = load(project), build_dir(project)
    img_dir = b / "images"
    if img_dir.exists():
        shutil.rmtree(img_dir)
    img_dir.mkdir()
    pc = json.loads((b / "pool_credits.json").read_text())
    credits = {}
    for i, sc in enumerate(cfg["scenes"]):
        for k, name in enumerate(sc.get("images", [])):
            dst = f"s{i:02d}_{k}.jpg"
            shutil.copy(b / "pool" / f"{name}.jpg", img_dir / dst)
            credits[dst] = {**pc[name], "creator": "see file page", "license": "Wikimedia Commons (free licence)"}
    (b / "credits.json").write_text(json.dumps(credits, indent=1))
    print(f"assign: {len(credits)} images")


def stage_images(project):
    if os.environ.get("IMAGE_SOURCE") == "wikimedia":
        return stage_images_wikimedia(project)
    if os.environ.get("PIXABAY_API_KEY"):
        return stage_images_pixabay(project)
    if os.environ.get("PEXELS_API_KEY"):
        return stage_images_pexels(project)
    from PIL import Image
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())["scenes"]
    img_dir = b / "images"
    img_dir.mkdir(exist_ok=True)
    credits_path = b / "credits.json"
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {}
    used = {c["id"] for c in credits.values()}
    for i, sc in enumerate(cfg["scenes"]):
        need = max(1, math.ceil((tl[i]["dur"] + tl[i]["gap"]) / CLIP_MAX))
        have = sorted(img_dir.glob(f"s{i:02d}_*.jpg"))
        if len(have) >= need:
            continue
        queries = [sc["query"]] + sc.get("fallback", []) + [" ".join(sc["query"].split()[-2:]),
                                                            sc["query"].split()[-1]]
        k = len(have)
        for q in dict.fromkeys(queries):
            if k >= need:
                break
            for r in openverse(q):
                if k >= need:
                    break
                if r["id"] in used or (r.get("width") or 0) < 1200:
                    continue
                try:
                    im = Image.open(BytesIO(http_get(r["url"], 40)))
                    if im.width < 1200 or im.width / im.height < 1.2:
                        continue
                    name = f"s{i:02d}_{k}.jpg"
                    cover(im, 2560, 1440).save(img_dir / name, quality=90)
                except Exception as e:
                    print("  skip", r["url"][:70], e)
                    continue
                used.add(r["id"])
                credits[name] = {"id": r["id"], "title": r.get("title"), "creator": r.get("creator"),
                                 "license": f"CC {r['license'].upper()} {r.get('license_version') or ''}".strip(),
                                 "url": r.get("foreign_landing_url"), "query": q}
                k += 1
                credits_path.write_text(json.dumps(credits, indent=1))
        print(f"  images s{i:02d}: {k}/{need}  ({sc['query']})")


# ---------------------------------------------------------------- render
MOVES = [  # (x0, y0) -> (x1, y1) as fractions of the free pan range
    ((0.0, 0.5), (1.0, 0.5)), ((1.0, 0.4), (0.0, 0.6)),
    ((0.2, 0.0), (0.8, 1.0)), ((0.8, 1.0), (0.2, 0.0)),
]


def esc(s):
    return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def stage_render(project):
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())
    clip_dir = b / "clips"
    clip_dir.mkdir(exist_ok=True)
    clips, n = [], 0
    for i, sc in enumerate(cfg["scenes"]):
        span = tl["scenes"][i]["dur"] + (tl["scenes"][i + 1]["gap"] if i + 1 < len(cfg["scenes"]) else 1.5)
        g = b / "graphics" / f"s{i:02d}.png"
        imgs = [g] if g.exists() else sorted(p for p in (b / "images").glob(f"s{i:02d}_*")
                                             if p.suffix in (".jpg", ".mp4"))
        if not imgs:
            raise SystemExit(f"no image for scene {i}")
        k = len(imgs)
        for j, img in enumerate(imgs):
            d = span / k
            (x0, y0), (x1, y1) = MOVES[n % len(MOVES)]
            # oversample 2x then pan a 90% window -> smooth sub-pixel motion
            fw, fh = 3840, 2160
            cw, ch = int(fw * 0.88), int(fh * 0.88)
            rx, ry = fw - cw, fh - ch
            p = f"(t/{d:.3f})"
            x = f"({x0}+({x1}-{x0})*{p})*{rx}"
            y = f"({y0}+({y1}-{y0})*{p})*{ry}"
            if img.suffix == ".png":   # own graphic: static, gentle fade in
                vf = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x080e1c,"
                      f"fps={FPS},format=yuv420p,fade=t=in:st=0:d=0.4")
                src = ["-loop", "1", "-framerate", str(FPS), "-i", str(img)]
            elif img.suffix == ".mp4":   # real footage: cover-crop, no pan
                vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                      f"fps={FPS},format=yuv420p")
                src = ["-stream_loop", "-1", "-ss", "1.0", "-i", str(img)]   # skip fade-in/black lead frames
            else:
                vf = (f"scale={fw}:{fh},crop={cw}:{ch}:x='{x}':y='{y}',scale={W}:{H}:flags=bicubic,"
                      f"fps={FPS},format=yuv420p")
                src = ["-loop", "1", "-framerate", str(FPS), "-i", str(img)]
            if j == 0 and sc.get("overlay") and img.suffix != ".png":
                txt = esc(sc["overlay"])
                font = FONT.as_posix().replace(":", "\\:")   # Windows: C\:/...
                vf += (f",drawtext=fontfile='{font}':text='{txt}':fontsize=88:fontcolor=white:"
                       f"x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=0x1b3a1f@0.82:boxborderw=28:"
                       f"alpha='if(lt(t,0.3),t/0.3,if(lt(t,3.6),1,if(lt(t,4.0),(4.0-t)/0.4,0)))'")
            out = clip_dir / f"c{n:03d}.mp4"
            sh("ffmpeg", "-y", *src, "-t", f"{d:.3f}", "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-an", str(out))
            clips.append(out)
            n += 1
        print(f"  render s{i:02d} ({k} clips, {span:.1f}s)")
    lst = b / "clips.txt"
    lst.write_text("".join(f"file '{c.resolve().as_posix()}'\n" for c in clips))
    sh("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(b / "video_only.mp4"))
    stage_finish(project)


# ---------------------------------------------------------------- end screen + music + final mix
ENDCARD_S = 20.0
MUSIC = ROOT / "assets" / "music"


def make_endcard(path):
    """1920x1080 end screen in brand style, with free areas where YouTube's end-screen
    elements go (video tile left, subscribe circle right)."""
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    W_, H_ = 1920, 1080
    im = Image.new("RGB", (W_, H_), (8, 14, 28))
    d = ImageDraw.Draw(im)
    for x in range(0, W_, 80):
        d.line([(x, 0), (x, H_)], fill=(14, 24, 44))
    for y in range(0, H_, 80):
        d.line([(0, y), (W_, y)], fill=(14, 24, 44))
    big = ImageFont.truetype(str(FONT), 96)
    small = ImageFont.truetype(str(FONT), 46)
    t = "OTHER END OF THE WIRE"
    d.text(((W_ - d.textlength(t, font=big)) / 2, 90), t, font=big, fill="white")
    t2 = "FOLLOW THE ELECTRON"
    d.text(((W_ - d.textlength(t2, font=small)) / 2, 205), t2, font=small, fill=(255, 196, 0))
    # brand motif: copper wire ending in a glowing point (the "other end")
    d.line([(0, 292), (1330, 292)], fill=(200, 117, 51), width=6)
    glow = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((1330 - 40, 292 - 40, 1330 + 40, 292 + 40), fill=(255, 196, 0, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    im.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(im)
    d.ellipse((1330 - 10, 292 - 10, 1330 + 10, 292 + 10), fill=(255, 240, 200))
    # placeholder frames (YouTube end-screen elements are placed on top in Studio)
    d.rounded_rectangle((150, 340, 150 + 880, 340 + 495), 18, outline=(70, 190, 255), width=4)
    d.text((150 + 440 - d.textlength("WATCH NEXT", font=small) / 2, 340 + 220), "WATCH NEXT", font=small,
           fill=(70, 120, 170))
    cx, cy, r = 1440, 588, 190
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 196, 0), width=6)
    d.text((cx - d.textlength("SUBSCRIBE", font=small) / 2, cy + r + 30), "SUBSCRIBE", font=small, fill="white")
    im.save(path)


def stage_finish(project):
    """Append the branded end screen, lay the channel's own music bed under the narration
    (quiet under speech, up on the end screen + sonic logo), loudness-normalise."""
    b = build_dir(project)
    ec_png, ec_mp4 = b / "endcard.png", b / "endcard.mp4"
    make_endcard(ec_png)
    sh("ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{ENDCARD_S}", "-i", str(ec_png),
       "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p,fade=t=in:st=0:d=0.6", "-c:v", "libx264",
       "-preset", "veryfast", "-crf", "20", "-an", str(ec_mp4))
    lst = b / "final_list.txt"
    lst.write_text(f"file '{(b / 'video_only.mp4').resolve().as_posix()}'\nfile '{ec_mp4.resolve().as_posix()}'\n")
    sh("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(b / "video_full.mp4"))
    main_len = duration(b / "video_only.mp4")
    total = main_len + ENDCARD_S
    bed, sting = MUSIC / "hidden_grid_bed.wav", MUSIC / "hidden_grid_sting.wav"
    if bed.exists():
        fc = (f"[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={total:.3f}[v];"
              f"[2:a]aresample=48000,atrim=0:{total:.3f},"
              f"volume='if(lt(t,{main_len:.2f}),0.09,0.09+0.31*min(1,(t-{main_len:.2f})/1.5))':eval=frame,"
              f"afade=t=out:st={total - 3:.2f}:d=3[m];"
              f"[3:a]aresample=48000,adelay={int(main_len * 1000)}|{int(main_len * 1000)},volume=0.8[s];"
              f"[v][m][s]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
        sh("ffmpeg", "-y", "-i", str(b / "video_full.mp4"), "-i", str(b / "voice.wav"),
           "-stream_loop", "-1", "-i", str(bed), "-i", str(sting), "-filter_complex", fc,
           "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}",
           "-movflags", "+faststart", str(b / "video.mp4"))
    else:
        sh("ffmpeg", "-y", "-i", str(b / "video_full.mp4"), "-i", str(b / "voice.wav"),
           "-af", f"apad=whole_dur={total:.3f},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart",
           str(b / "video.mp4"))
    print(f"render: {b / 'video.mp4'}  {duration(b / 'video.mp4') / 60:.2f} min (incl. {ENDCARD_S:.0f}s end screen)")


# ---------------------------------------------------------------- thumbnails
def stage_thumbs(project):
    from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter
    cfg, b = load(project), build_dir(project)
    out = b / "thumbnails"
    out.mkdir(exist_ok=True)
    for n, t in enumerate(cfg.get("thumbnails", [])):
        if t.get("asset"):  # own chart/graphic, finished design (no extra text)
            Image.open(project / t["asset"]).convert("RGB").resize((1280, 720)).save(out / f"thumbnail_{n + 1}.jpg", quality=92)
            print("  thumb", n + 1, "(asset)")
            continue
        if t.get("split"):  # two photos side by side, e.g. night | noon
            l, r = (cover(Image.open(b / "images" / f), 640, 720) for f in t["split"])
            bg = Image.new("RGB", (1280, 720))
            bg.paste(l, (0, 0)); bg.paste(r, (640, 0))
            bg = ImageEnhance.Contrast(ImageEnhance.Color(bg).enhance(1.3)).enhance(1.1)
            d = ImageDraw.Draw(bg)
            d.rectangle((634, 0, 646, 720), fill=(200, 117, 51))  # copper seam = the wire
            for (txt, size, color), x in zip(t["lines"], (60, 700)):
                f = ImageFont.truetype(str(FONT), size)
                d.text((x, 470), txt, font=f, fill=color, stroke_width=max(4, size // 16), stroke_fill="black")
            if t.get("badge"):
                f = ImageFont.truetype(str(FONT), 64)
                w = d.textlength(t["badge"], font=f)
                d.rounded_rectangle((1280 - w - 110, 40, 1240, 160), 18, fill=(214, 40, 40))
                d.text((1280 - w - 80, 52), t["badge"], font=f, fill="white")
            bg.save(out / f"thumbnail_{n + 1}.jpg", quality=92)
            print("  thumb", n + 1, "(split)")
            continue
        bg = cover(Image.open(b / "images" / t["image"]), 1280, 720)
        bg = ImageEnhance.Contrast(ImageEnhance.Color(bg).enhance(1.35)).enhance(1.15)
        shade = Image.new("L", (1280, 720), 0)
        ImageDraw.Draw(shade).rectangle((0, 0, 760, 720), fill=170)
        shade = shade.filter(ImageFilter.GaussianBlur(120))
        bg = Image.composite(Image.new("RGB", bg.size, (0, 0, 0)), bg, shade)
        d = ImageDraw.Draw(bg)
        y = 70
        for line, size, color in t["lines"]:
            f = ImageFont.truetype(str(FONT), size)
            d.text((60, y), line, font=f, fill=color, stroke_width=max(4, size // 16), stroke_fill="black")
            y += int(size * 1.12)
        if t.get("badge"):
            f = ImageFont.truetype(str(FONT), 64)
            w = d.textlength(t["badge"], font=f)
            # top-right: bottom-right is covered by YouTube's duration stamp
            d.rounded_rectangle((1280 - w - 110, 40, 1240, 160), 18, fill=(214, 40, 40))
            d.text((1280 - w - 80, 52), t["badge"], font=f, fill="white")
        bg.save(out / f"thumbnail_{n + 1}.jpg", quality=92)
        print("  thumb", n + 1)


# ---------------------------------------------------------------- metadata
def stage_meta(project):
    cfg, b = load(project), build_dir(project)
    tl = json.loads((b / "timeline.json").read_text())
    meta = cfg.get("meta", {})
    lines = ["# Upload package", "", "## Title options", ""]
    lines += [f"{n}. {t}" for n, t in enumerate(meta.get("titles", []), 1)]
    lines += ["", "## Description", "", "```", meta.get("description", "").strip(), "", "CHAPTERS"]
    for sc, t in zip(cfg["scenes"], tl["scenes"]):
        if sc.get("chapter"):
            s = int(t["start"]) if t["i"] else 0
            lines.append(f"{s // 60}:{s % 60:02d} {sc['chapter']}")
    credits = json.loads((b / "credits.json").read_text())
    pix = {k: c for k, c in credits.items() if "Pixabay" in (c.get("license") or "")}
    other = {k: c for k, c in credits.items() if k not in pix}
    lines += [""]
    if pix:  # Pixabay licence needs no attribution -> one line; full list in credits.md
        lines.append("Stock footage and photos: Pixabay (Pixabay Content License).")
    seen = set()
    for c in other.values():  # licences that require attribution are listed individually
        key = (c.get("creator"), c.get("url"))
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"\"{(c.get('title') or 'Untitled')[:60]}\" by {c.get('creator') or 'unknown'}, {c.get('license')}, {c.get('url')}")
    def fetched(k):  # download date = file date of the media (licence proof)
        f = b / "images" / k
        return time.strftime("%Y-%m-%d", time.localtime(f.stat().st_mtime)) if f.exists() else "n/a"
    full = ["# Footage & photo credits", "", "Downloaded = date the file was fetched (licence terms as of that date).", ""] + [
        f"- {k}: \"{(c.get('title') or '')[:70]}\" by {c.get('creator')}, {c.get('license')}, {c.get('url')}, downloaded {fetched(k)}"
        for k, c in sorted(credits.items())]
    (b / "credits.md").write_text("\n".join(full) + "\n")
    desc_len = len("\n".join(lines[lines.index("```") + 1:]))
    lines += ["```", "", f"_Description length: {desc_len} characters (YouTube limit 5,000)._", "",
              "## Tags", "", ", ".join(meta.get("tags", [])), "",
              "## Upload checklist", "",
              "- Upload video.mp4, choose a thumbnail from thumbnails/",
              "- Subtitles: upload captions.srt (English) and captions.<lang>.srt (translations.md has titles/descriptions)",
              "- Altered or synthetic content: answer honestly (narration voice is synthetic;"
              " no realistic AI people or events are shown)",
              "- Add end screen (last 20 s) and a pinned comment with a question", ""]
    (b / "metadata.md").write_text("\n".join(lines))
    print("meta:", b / "metadata.md")


def stage_sheets(project, per_sheet=25, cols=5):
    """Contact sheets of build/images (videos: frame at 2 s) for the editor review -> build/sheets/."""
    from PIL import Image, ImageDraw, ImageFont
    b = build_dir(project)
    out = b / "sheets"
    out.mkdir(exist_ok=True)
    for old in out.glob("*.jpg"):
        old.unlink()
    files = sorted(p for p in (b / "images").glob("s*_*") if p.suffix in (".jpg", ".mp4"))
    font = ImageFont.truetype(str(FONT), 30)
    w, h = 400, 225
    for n0 in range(0, len(files), per_sheet):
        chunk = files[n0:n0 + per_sheet]
        rows = math.ceil(len(chunk) / cols)
        sheet = Image.new("RGB", (w * cols, h * rows), "white")
        d = ImageDraw.Draw(sheet)
        for n, p in enumerate(chunk):
            if p.suffix == ".mp4":
                png = subprocess.run(["ffmpeg", "-v", "error", "-ss", "2", "-i", str(p), "-frames:v", "1",
                                      "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
                im = Image.open(BytesIO(png)) if png else Image.new("RGB", (w, h), "grey")
            else:
                im = Image.open(p)
            x, y = (n % cols) * w, (n // cols) * h
            sheet.paste(im.convert("RGB").resize((w - 4, h - 4)), (x + 2, y + 2))
            label = p.stem + (" VID" if p.suffix == ".mp4" else "")
            d.rectangle((x + 2, y + 2, x + 170, y + 40), fill="black")
            d.text((x + 8, y + 4), label, font=font, fill="yellow")
        sheet.save(out / f"sheet_{n0 // per_sheet + 1:02d}.jpg", quality=78)
    print(f"sheets: {math.ceil(len(files) / per_sheet)} in {out}")


def stage_reject(project, names):
    """Delete rejected media (e.g. s03_1 s07_0), renumber per scene (videos first)."""
    b = build_dir(project)
    img = b / "images"
    cpath = b / "credits.json"
    credits = json.loads(cpath.read_text()) if cpath.exists() else {}
    rpath = b / "rejected.json"
    rejected = set(json.loads(rpath.read_text())) if rpath.exists() else set()
    for n in names:
        for f in img.glob(f"{n}.*"):
            f.unlink()
            c = credits.pop(f.name, None)
            if c:
                rejected.add(c["id"])
    rpath.write_text(json.dumps(sorted(rejected)))
    scenes = sorted({p.name.split("_")[0] for p in img.glob("s*_*")})
    for s in scenes:
        fs = sorted(img.glob(f"{s}_*"), key=lambda f: (f.suffix != ".mp4", f.name))
        tmp = []
        for k, f in enumerate(fs):
            t = img / f"tmp_{s}_{k}{f.suffix}"
            f.rename(t)
            tmp.append((t, f.name, k))
        for t, old, k in tmp:
            new = img / f"{s}_{k}{t.suffix}"
            t.rename(new)
            if old in credits:
                credits[new.name + "__"] = credits.pop(old)
    credits = {k.removesuffix("__"): v for k, v in credits.items()}
    cpath.write_text(json.dumps(credits, indent=1))
    print(f"reject: removed {len(names)}, now {len(list(img.glob('s*_*')))} files")


STAGES = {"voice": stage_voice, "images": stage_images, "pool": stage_pool, "assign": stage_assign,
          "sheets": stage_sheets,
          "render": stage_render,
          "finish": stage_finish, "thumbs": stage_thumbs, "meta": stage_meta}

if __name__ == "__main__":
    project = Path(sys.argv[1]).resolve()
    if len(sys.argv) > 2 and sys.argv[2] == "reject":     # make_video.py <proj> reject s03_1 s07_0 ...
        stage_reject(project, sys.argv[3:])
        sys.exit()
    for st in (sys.argv[2:] or ["voice", "images", "sheets", "render", "thumbs", "meta"]):
        print(f"== {st}")
        STAGES[st](project)
