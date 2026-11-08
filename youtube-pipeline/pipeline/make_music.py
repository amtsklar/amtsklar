#!/usr/bin/env python3
"""Own, royalty-free ambient music bed for The Hidden Grid (no licence / Content ID risk).
Slow minor-key pad (A minor – F – C – G), soft pulse, gentle filter movement. Loopable.
Usage: python3 pipeline/make_music.py  -> assets/music/hidden_grid_bed.wav (+ sting)"""
import wave
from pathlib import Path
import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "music"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def note(f, dur, detune=0.003, voices=3):
    t = np.arange(int(dur * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * (1 + detune * (v - 1)) * t + rng.uniform(0, 6.28)) for v in range(voices))
    sig += 0.25 * sum(np.sin(2 * np.pi * 2 * f * (1 + detune * v) * t) for v in range(2))
    return sig / (voices + 0.5)


def env(n, a=2.0, r=2.5):
    e = np.ones(n)
    ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai) ** 2
    e[-ri:] = np.linspace(1, 0, ri) ** 2
    return e


def lowpass(x, cutoff):
    # one-pole low-pass, cutoff array or scalar
    y = np.zeros_like(x)
    a = np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


A3, C4, E4, F3, G3, B3, D4 = 220.0, 261.63, 329.63, 174.61, 196.0, 246.94, 293.66
chords = [(A3, C4, E4), (F3, A3, C4), (C4 / 2 * 2, E4, G3 * 2), (G3, B3, D4)]
bar = 8.0  # seconds per chord (~60 BPM, 2 bars of 4/4)
length = bar * len(chords) * 3  # ~96 s loop
mix = np.zeros(int(length * SR) + SR * 3)
for k in range(int(length // bar)):
    ch = chords[k % len(chords)]
    start = int(k * bar * SR)
    for f in ch:
        n = note(f, bar + 2.5)
        mix[start:start + len(n)] += 0.22 * n * env(len(n))
    bass = note(ch[0] / 2, bar + 2.0, voices=2)
    mix[start:start + len(bass)] += 0.18 * bass * env(len(bass), 1.5, 2.0)
# soft pulse ("electron") on each beat, very quiet
t = np.arange(len(mix)) / SR
pulse = np.sin(2 * np.pi * 880 * t) * np.exp(-((t % 1.0)) * 18)
mix += 0.025 * pulse
# slow filter sweep for movement
cut = 900 + 600 * np.sin(2 * np.pi * t / 32)
mix = lowpass(mix, cut)
mix = mix[: int(length * SR)]
# crossfade end into start for seamless loop
xf = int(3 * SR)
mix[:xf] = mix[:xf] * np.linspace(0, 1, xf) + mix[-xf:] * np.linspace(1, 0, xf)
mix = mix[:-xf]
mix = mix / np.max(np.abs(mix)) * 0.6


def write(path, x):
    st = np.stack([x, np.roll(x, int(0.012 * SR))], axis=1)  # slight stereo width
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())


write(OUT / "hidden_grid_bed.wav", mix)
# sonic logo / end sting: rising A-minor arpeggio + resolve, 4 s
st = np.zeros(int(4.5 * SR))
for i, f in enumerate([A3, C4, E4, A3 * 2]):
    n = note(f, 3.2 - i * 0.4)
    s = int(i * 0.28 * SR)
    st[s:s + len(n)] += 0.3 * n * env(len(n), 0.03, 2.0)
st = lowpass(st, 2200)
st = st / np.max(np.abs(st)) * 0.7
write(OUT / "hidden_grid_sting.wav", st)
print("music:", OUT / "hidden_grid_bed.wav", f"{len(mix) / SR:.0f}s; sting 4.5s")
