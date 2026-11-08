#!/usr/bin/env python3
"""Vertical YouTube Shorts (1080x1920) from already-vetted material of a long video.

shorts/<name>/short.json:
  {"voice": "en-US-GuyNeural", "rate": "+0%", "title": "100 IN, 28 BACK",
   "scenes": [{"text": "...", "src": "hydrogen-01/build/graphics/s01.png"}, ...]}
  src is relative to projects/ (graphics .png, photos .jpg, clips .mp4).

Usage: python3 pipeline/make_short.py shorts/<name>
Output: shorts/<name>/build/short.mp4 (narration, burned-in captions, title bar)
"""
import json, math, shutil, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_video as mv  # voice stage, helpers

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "projects"
FONT = ROOT / "assets" / "Anton-Regular.ttf"
W, H, FPS = 1080, 1920, 30


def sh(*a):
    r = subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if r.returncode:
        raise SystemExit(r.stderr[-2000:])


def ass_time(s):
    cs = int(round(s * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def chunks(cue, n=4):
    words = cue["text"].split()
    parts = [words[i:i + n] for i in range(0, len(words), n)]
    tot = sum(len(" ".join(p)) for p in parts) or 1
    t, out = cue["start"], []
    for p in parts:
        d = (cue["end"] - cue["start"]) * len(" ".join(p)) / tot
        out.append((t, t + d, " ".join(p)))
        t += d
    return out


def parse_srt(text):
    cues = []
    for block in text.strip().split("\n\n"):
        lines = block.splitlines()
        if len(lines) < 3:
            continue
        a, b = lines[1].split(" --> ")
        f = lambda x: int(x[:2]) * 3600 + int(x[3:5]) * 60 + int(x[6:8]) + int(x[9:]) / 1000
        cues.append({"start": f(a), "end": f(b), "text": " ".join(lines[2:])})
    return cues


def main(short):
    short = Path(short).resolve()
    cfg = json.loads((short / "short.json").read_text())
    # reuse the long-video voice stage (expects scenes.json)
    (short / "scenes.json").write_text(json.dumps({"voice": cfg["voice"], "rate": cfg.get("rate", "+0%"),
                                                   "scenes": [{"text": s["text"]} for s in cfg["scenes"]]}))
    mv.GAP, mv.CHAPTER_GAP = 0.15, 0.15
    mv.stage_voice(short)
    b = short / "build"
    tl = json.loads((b / "timeline.json").read_text())
    clips = []
    (b / "vclips").mkdir(exist_ok=True)
    for i, sc in enumerate(cfg["scenes"]):
        src = PROJECTS / sc["src"]
        nxt = tl["scenes"][i + 1]["gap"] if i + 1 < len(cfg["scenes"]) else 0.6
        d = tl["scenes"][i]["dur"] + nxt
        inp = (["-stream_loop", "-1", "-ss", "1.0", "-i", str(src)] if src.suffix == ".mp4"
               else ["-loop", "1", "-framerate", str(FPS), "-i", str(src)])
        zoom = "" if src.suffix != ".jpg" else f",zoompan=z='1+0.04*on/{int(d * FPS)}':d=1:s={W}x{int(W * 9 / 16)}:fps={FPS}"
        fc = (f"[0:v]split[a][b];"
              f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:5,eq=brightness=-0.25[bg];"
              f"[b]scale={W}:-2{zoom}[fg];"
              f"[bg][fg]overlay=(W-w)/2:(H-h)/2-80,fps={FPS},format=yuv420p")
        out = b / "vclips" / f"c{i:02d}.mp4"
        sh("ffmpeg", "-y", *inp, "-t", f"{d:.3f}", "-filter_complex", fc, "-an",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", str(out))
        clips.append(out)
    lst = b / "vlist.txt"
    lst.write_text("".join(f"file '{c.as_posix()}'\n" for c in clips))
    sh("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(b / "v.mp4"))
    # burned-in captions (ASS, 4 words per line) + title bar
    cues = parse_srt((b / "captions.srt").read_text())
    ev = []
    for c in cues:
        for s, e, t in chunks(c):
            ev.append(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{t.upper()}")
    title = cfg["title"].upper()
    ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Anton,92,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,1,0,1,6,2,2,60,60,430,1
Style: Title,Anton,96,&H0000C4FF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,6,0,8,60,60,230,1
Style: Brand,Anton,46,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,3,0,8,60,60,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,9:00:00.00,Brand,,0,0,0,,THE HIDDEN GRID
Dialogue: 0,0:00:00.00,9:00:00.00,Title,,0,0,0,,{title}
""" + "\n".join(ev) + "\n"
    (b / "captions.ass").write_text(ass)
    fontsdir = FONT.parent.as_posix().replace(":", "\\:")
    sh("ffmpeg", "-y", "-i", str(b / "v.mp4"), "-i", str(b / "voice.wav"),
       "-vf", f"ass={(b / 'captions.ass').as_posix()}:fontsdir={fontsdir}",
       "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000",
       "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-c:a", "aac", "-b:a", "160k", "-ac", "2",
       "-shortest", "-movflags", "+faststart", str(b / "short.mp4"))
    print(f"short: {b / 'short.mp4'}  {mv.duration(b / 'short.mp4'):.1f}s")


if __name__ == "__main__":
    main(sys.argv[1])
