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
async def _tts(text, voice, rate, out):
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
                sentences = asyncio.run(_tts(sc["text"], cfg["voice"], cfg.get("rate", "+0%"), mp3))
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
    for i, sc in enumerate(cfg["scenes"]):
        need = max(1, math.ceil((tl[i]["dur"] + tl[i]["gap"]) / CLIP_MAX))
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
        imgs = sorted(p for p in (b / "images").glob(f"s{i:02d}_*") if p.suffix in (".jpg", ".mp4"))
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
            if img.suffix == ".mp4":   # real footage: cover-crop, no pan
                vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                      f"fps={FPS},format=yuv420p")
                src = ["-stream_loop", "-1", "-i", str(img)]
            else:
                vf = (f"scale={fw}:{fh},crop={cw}:{ch}:x='{x}':y='{y}',scale={W}:{H}:flags=bicubic,"
                      f"fps={FPS},format=yuv420p")
                src = ["-loop", "1", "-framerate", str(FPS), "-i", str(img)]
            if j == 0 and sc.get("overlay"):
                txt = esc(sc["overlay"])
                vf += (f",drawtext=fontfile='{FONT}':text='{txt}':fontsize=88:fontcolor=white:"
                       f"x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=0x1b3a1f@0.82:boxborderw=28:"
                       f"alpha='if(lt(t,0.3),t/0.3,if(lt(t,3.6),1,if(lt(t,4.0),(4.0-t)/0.4,0)))'")
            out = clip_dir / f"c{n:03d}.mp4"
            sh("ffmpeg", "-y", *src, "-t", f"{d:.3f}", "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-an", str(out))
            clips.append(out)
            n += 1
        print(f"  render s{i:02d} ({k} clips, {span:.1f}s)")
    lst = b / "clips.txt"
    lst.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))
    sh("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(b / "video_only.mp4"))
    # mux narration, loudness-normalised for YouTube (-14 LUFS)
    sh("ffmpeg", "-y", "-i", str(b / "video_only.mp4"), "-i", str(b / "voice.wav"),
       "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000", "-c:v", "copy",
       "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(b / "video.mp4"))
    print(f"render: {b / 'video.mp4'}  {duration(b / 'video.mp4') / 60:.2f} min")


# ---------------------------------------------------------------- thumbnails
def stage_thumbs(project):
    from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter
    cfg, b = load(project), build_dir(project)
    out = b / "thumbnails"
    out.mkdir(exist_ok=True)
    for n, t in enumerate(cfg.get("thumbnails", [])):
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
            d.rounded_rectangle((1280 - w - 110, 560, 1240, 680), 18, fill=(214, 40, 40))
            d.text((1280 - w - 80, 572), t["badge"], font=f, fill="white")
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
    lines += ["", "PHOTO CREDITS (Creative Commons, via Openverse)"]
    seen = set()
    for c in credits.values():
        key = (c["creator"], c["url"])
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"\"{(c['title'] or 'Untitled')[:60]}\" by {c['creator'] or 'unknown'}, {c['license']}, {c['url']}")
    lines += ["```", "", "## Tags", "", ", ".join(meta.get("tags", [])), "",
              "## Upload checklist", "",
              "- Upload video.mp4, choose a thumbnail from thumbnails/",
              "- Subtitles: upload captions.srt (English)",
              "- Altered or synthetic content: answer honestly (narration voice is synthetic;"
              " no realistic AI people or events are shown)",
              "- Add end screen (last 20 s) and a pinned comment with a question", ""]
    (b / "metadata.md").write_text("\n".join(lines))
    print("meta:", b / "metadata.md")


STAGES = {"voice": stage_voice, "images": stage_images, "pool": stage_pool, "assign": stage_assign,
          "render": stage_render,
          "thumbs": stage_thumbs, "meta": stage_meta}

if __name__ == "__main__":
    project = Path(sys.argv[1]).resolve()
    for st in (sys.argv[2:] or list(STAGES)):
        print(f"== {st}")
        STAGES[st](project)
