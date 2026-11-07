#!/usr/bin/env python3
"""Own graphics for 'From Nuclear Plant to Phone Charger'. Data: see sources.md, '## Graphics data'."""
import sys
from pathlib import Path
import numpy as np
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "pipeline"))
from gfx import *  # noqa

OUT = HERE / "build" / "graphics"
OUT.mkdir(parents=True, exist_ok=True)

# s06 stat tiles
f = fig("AMERICA'S NUCLEAR FLEET", "Operating commercial reactors, as of March 2026",
        "Source: U.S. Energy Information Administration (EIA). Capacity factor: EIA, 2025.")
tiles(f, [("94", "reactors", AMBER), ("54", "power plants", CYAN), ("28", "states", WHITE), ("91%", "avg. capacity\nfactor, 2025", GREEN)])
save(f, OUT / "s06.png")

# s12 heat -> electricity
f = fig("ONLY A THIRD OF THE HEAT BECOMES POWER", "U.S. nuclear plants, 2025: out of every 100 units of reactor heat",
        "Source: EIA Electric Power Annual, Table 8.1 (2025 heat rate 10,443 Btu/kWh) and EIA FAQ (3,412 Btu = 1 kWh). Our calculation.")
ax = axes(f, (0.08, 0.30, 0.84, 0.30)); ax.grid(False)
ax.barh([0], [32.7], color=AMBER, height=0.6); ax.barh([0], [67.3], left=[32.7], color="#2b4a7a", height=0.6)
ax.text(16, 0, "~33\nELECTRICITY", ha="center", va="center", fontproperties=ANTON, fontsize=44, color=BG)
ax.text(66, 0, "~67  LEAVES AS WASTE HEAT", ha="center", va="center", fontproperties=ANTON, fontsize=44, color=WHITE)
ax.set_xlim(0, 100); ax.set_yticks([]); ax.set_xticks([0, 25, 50, 75, 100]); ax.spines["left"].set_visible(False)
save(f, OUT / "s12.png")

# s16 voltage ladder
f = fig("THE VOLTAGE LADDER", "Typical U.S. voltages from the plant to your outlet",
        "Sources: U.S. DOE, United States Electricity Industry Primer (2015); HyperPhysics, Georgia State University.")
ax = canvas(f)
steps = [("GENERATOR", "5–34.5 kV", CYAN), ("STEP-UP\nTRANSFORMER", "", WHITE), ("TRANSMISSION", "138–765 kV", RED),
         ("SUBSTATION", "", WHITE), ("DISTRIBUTION", "e.g. 7.2 kV", AMBER), ("POLE\nTRANSFORMER", "", WHITE),
         ("YOUR HOME", "120 / 240 V", GREEN), ("CHARGER", "low V DC", CYAN)]
heights = [38, 56, 80, 56, 46, 30, 18, 8]
w = 11.2
for i, ((name, v, col), hgt) in enumerate(zip(steps, heights)):
    x = 1 + i * 12.4
    ax.add_patch(plt.Rectangle((x, 10), w, hgt, fc=col if v else PANEL, ec=col, lw=3, alpha=0.9 if v else 1))
    ax.text(x + w / 2, 4.5, name, ha="center", va="center", fontsize=15, fontweight="bold", color=WHITE)
    if v:
        ax.text(x + w / 2, 10 + hgt + 3.5, v, ha="center", va="bottom", fontproperties=ANTON, fontsize=28, color=col)
save(f, OUT / "s16.png")

# s18 square law
f = fig("WHY THE GRID GOES HIGH", "Same power, two ways to send it",
        "Physics: power = voltage × current; heat lost in a wire ∝ current². Source: HyperPhysics, Georgia State University.")
ax = canvas(f)
for row, (lab, v, c, loss, col) in enumerate([("LOW VOLTAGE", "1×", "1×", "1×", RED), ("DOUBLE VOLTAGE", "2×", "½×", "¼×", GREEN)]):
    y = 62 - row * 40
    ax.text(2, y + 10, lab, fontproperties=ANTON, fontsize=40, color=col)
    for j, (k, val) in enumerate([("VOLTAGE", v), ("CURRENT", c), ("HEAT LOST\nIN THE WIRE", loss)]):
        box(ax, 32 + j * 23, y, 19, 20, f"{k}\n{val}", color=col, fs=24)
        if j < 2:
            arrow(ax, 32 + j * 23 + 19.8, y + 10, 32 + (j + 1) * 23 - 0.8, y + 10, color=MUTED, lw=3)
save(f, OUT / "s18.png")

# s23 house wiring
f = fig("HOW YOUR HOUSE GETS 120 AND 240 VOLTS", "A standard U.S. split-phase service",
        "Source: HyperPhysics, Georgia State University (household wiring).")
ax = canvas(f)
box(ax, 4, 32, 22, 36, "POLE\nTRANSFORMER", color=AMBER, fs=26)
for y, lab, col in [(76, "HOT WIRE A", RED), (50, "NEUTRAL", WHITE), (24, "HOT WIRE B", RED)]:
    ax.plot([27, 60], [y, y], color=col, lw=6)
    ax.text(43, y + 3, lab, ha="center", fontsize=20, fontweight="bold", color=col)
box(ax, 66, 58, 30, 20, "A to neutral\n120 V  ·  outlets", color=CYAN, fs=26)
box(ax, 66, 22, 30, 20, "A to B\n240 V  ·  dryer, range", color=GREEN, fs=26)
arrow(ax, 60, 70, 65, 68, color=CYAN); arrow(ax, 60, 30, 65, 32, color=GREEN)
save(f, OUT / "s23.png")

# s24 losses
f = fig("WHAT THE GRID LOSES ON THE WAY", "U.S. transmission and distribution, average 2018–2022",
        "Source: U.S. Energy Information Administration, FAQ: How much electricity is lost in transmission and distribution?")
ax = axes(f, (0.08, 0.32, 0.84, 0.28)); ax.grid(False)
ax.barh([0], [95], color=CYAN, height=0.6); ax.barh([0], [5], left=[95], color=RED, height=0.6)
ax.text(47.5, 0, "~95% DELIVERED", ha="center", va="center", fontproperties=ANTON, fontsize=54, color=BG)
ax.annotate("~5% LOST", (97.5, -0.32), (74, -0.72), fontproperties=ANTON, fontsize=44, color=RED,
            arrowprops=dict(arrowstyle="->", color=RED, lw=4), annotation_clip=False)
ax.set_xticks([])
ax.set_xlim(0, 100); ax.set_yticks([]); ax.spines["left"].set_visible(False)
save(f, OUT / "s24.png")

# s26 speed comparison (log scale)
f = fig("THE ELECTRONS BARELY MOVE", "Speed comparison (log scale)",
        "Source: HyperPhysics, Georgia State University (drift-velocity example: 3 A in a 1 mm copper wire).")
ax = axes(f, (0.30, 0.20, 0.62, 0.56))
vals = [0.00028, 300_000_000]
ax.barh([1, 0], vals, color=[AMBER, CYAN], height=0.5)
ax.set_xscale("log"); ax.set_xlim(1e-5, 1e10)
ax.set_yticks([1, 0]); ax.set_yticklabels(["Electron drift", "The signal\n(near light speed)"], fontsize=26)
ax.text(0.00028 * 2, 1, "  0.00028 m/s", va="center", fontproperties=ANTON, fontsize=40, color=AMBER)
ax.text(1e5, 0, "300,000,000 m/s  ", va="center", ha="right", fontproperties=ANTON, fontsize=40, color=BG)
ax.set_xlabel("meters per second", fontsize=20)
save(f, OUT / "s26.png")

# s27 AC sine wave
f = fig("ALTERNATING CURRENT", "U.S. household power: 120 V effective, peaks near ±170 V, 60 cycles every second",
        "Source: OpenStax, College Physics 2e, Section 20.5 (Alternating Current versus Direct Current).")
ax = axes(f)
t = np.linspace(0, 1 / 30, 1000)
ax.plot(t * 1000, 170 * np.sin(2 * np.pi * 60 * t), color=AMBER, lw=6)
ax.axhline(0, color=MUTED, lw=2)
for v, lab in [(170, "+170 V"), (-170, "−170 V")]:
    ax.axhline(v, color=CYAN, lw=2, ls="--"); ax.text(34.2, v, lab, va="center", fontsize=24, color=CYAN, fontweight="bold")
ax.set_xlim(0, 38); ax.set_ylim(-210, 210)
ax.set_xlabel("milliseconds (two full cycles = 1/30 of a second)"); ax.set_ylabel("volts")
save(f, OUT / "s27.png")

# s34 recap flow
f = fig("THE FULL TRIP", "From splitting atoms to your phone's battery",
        "Sources: EIA (2025 heat rates, our calculation; T&D losses 2018–2022); U.S. DOE; HyperPhysics.")
ax = canvas(f)
row1 = ["FISSION", "HEAT", "STEAM", "TURBINE", "GENERATOR\n60 Hz", "STEP-UP"]
row2 = ["TRANSMISSION", "SUBSTATION", "DISTRIBUTION", "POLE\nTRANSFORMER", "OUTLET\n120/240 V", "CHARGER\nAC → DC"]
for r, row in enumerate([row1, row2]):
    y = 66 - r * 40
    for i, t in enumerate(row):
        x = 1 + i * 16.4
        box(ax, x, y, 13.4, 17, t, color=AMBER if r == 0 else CYAN, fs=17)
        if i < len(row) - 1:
            arrow(ax, x + 14.2, y + 8.5, x + 16.0, y + 8.5, color=MUTED, lw=3)
arrow(ax, 91, 65, 9, 44.5, color=MUTED, lw=2)
ax.text(28, 92, "~1/3 of the heat becomes electricity (2025)", ha="center", fontsize=22, color=AMBER, fontweight="bold")
ax.text(50, 6, "~5% lost on the grid (2018–2022)", ha="center", fontsize=22, color=RED, fontweight="bold")
save(f, OUT / "s34.png")
