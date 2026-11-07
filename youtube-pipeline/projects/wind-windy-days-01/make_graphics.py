#!/usr/bin/env python3
"""Own graphics for 'Why Wind Turbines STOP on the Windiest Days'. Data: see sources.md, '## Graphics data'."""
import sys
from pathlib import Path
import numpy as np
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "pipeline"))
from gfx import *  # noqa

OUT = HERE / "build" / "graphics"
OUT.mkdir(parents=True, exist_ok=True)
MPH = 2.23694

# s04 turbine size
f = fig("TODAY'S TYPICAL NEW TURBINE", "Average new U.S. land-based turbine installed in 2025 (2025 data partial)",
        "Source: Berkeley Lab / U.S. DOE, Land-Based Wind Energy Technology Data Update (2026).")
ax = canvas(f, (0.04, 0.10, 0.92, 0.72))
hub, rot = 102, 141
s = 100 / 190  # 190 m tall drawing -> 100 units
cx = 30
ax.plot([cx, cx], [0, hub * s], color=WHITE, lw=10)
ang = np.deg2rad([90, 210, 330])
for a in ang:
    ax.plot([cx, cx + np.cos(a) * rot / 2 * s * 0.56], [hub * s, hub * s + np.sin(a) * rot / 2 * s], color=WHITE, lw=6)
ax.add_patch(plt.Circle((cx, hub * s), 1.2, color=AMBER))
for big, small, y, col in [("3.8 MW", "nameplate capacity", 78, AMBER), ("102 m  (~335 ft)", "hub height", 50, CYAN),
                           ("141 m  (~460 ft)", "rotor diameter", 22, GREEN)]:
    ax.text(55, y, big, fontproperties=ANTON, fontsize=60, color=col)
    ax.text(55, y - 7, small, fontsize=26, color=WHITE)
save(f, OUT / "s04.png")

# s08 capacity factor
f = fig("HOW HARD U.S. WIND FARMS WORK", "Capacity factor in calendar year 2025: actual output vs. running flat out all year",
        "Source: Berkeley Lab / U.S. DOE, Land-Based Wind Energy Technology Data Update (2026).")
bars(f, ["Whole fleet\n(built 1998–2024)", "Projects built\nin 2024"], [34.0, 37.1], ["34%", "37.1%"], ylim=45)
save(f, OUT / "s08.png")

# s11 cube law
f = fig("DOUBLE THE WIND, 8× THE POWER", "Power in the wind rises with the cube of wind speed",
        "Physics (P ∝ v³). Source: Iowa State University, Wind Science Program.")
bars(f, ["1× wind speed", "1.5× wind speed", "2× wind speed"], [1, 3.375, 8], ["1×", "3.4×", "8×"],
     colors=[CYAN, AMBER, RED], ylim=10, rect=(0.14, 0.19, 0.72, 0.60))
save(f, OUT / "s11.png")

# s14 power curve (illustrative)
f = fig("A TURBINE'S POWER CURVE", "Illustrative shape. Speeds from an international 3.4-MW land-based reference turbine",
        "Illustrative; cut-in / rated / cut-out speeds from the IEA Wind Task 37 reference turbine (NREL/DTU/SINTEF, 2019).")
ax = axes(f)
ci, ra, co = 4 * MPH, 9.8 * MPH, 25 * MPH
v = np.linspace(0, 65, 1300)
p = np.where(v < ci, 0, np.where(v < ra, 100 * (v ** 3 - ci ** 3) / (ra ** 3 - ci ** 3), np.where(v <= co, 100, 0)))
ax.plot(v, p, color=AMBER, lw=7)
for x, lab, col in [(ci, "CUT-IN\n~9 mph", CYAN), (ra, "RATED\n~22 mph", GREEN), (co, "CUT-OUT\n~56 mph", RED)]:
    ax.axvline(x, color=col, lw=2, ls="--")
    ax.text(x + 0.6, 108, lab, color=col, fontsize=22, fontweight="bold", va="bottom")
ax.set_xlim(0, 65); ax.set_ylim(0, 135)
ax.set_xlabel("wind speed (mph)"); ax.set_ylabel("% of rated power")
save(f, OUT / "s14.png")

# s19 cut-out vs design limits
f = fig("STOPPING EARLY, ON PURPOSE", "Typical cut-out speed vs. what turbines are designed to survive (mph)",
        "Source: U.S. DOE Wind Energy Technologies Office (cut-out 55–65 mph; IEC 61400-1 design limits as cited by DOE).")
ax = axes(f, (0.30, 0.18, 0.62, 0.58))
labs = ["Typical cut-out", "Design limit:\nsustained wind", "Design limit:\n3-second gust"]
ax.barh([2, 1, 0], [65, 112, 156], color=[AMBER, CYAN, RED], height=0.55)
ax.barh([2], [55], color=BG, height=0.55, alpha=0.35)
for y, t, x in [(2, "55–65 mph", 65), (1, "112 mph", 112), (0, "156 mph", 156)]:
    ax.text(x + 2, y, t, va="center", fontproperties=ANTON, fontsize=44)
ax.set_yticks([2, 1, 0]); ax.set_yticklabels(labs, fontsize=24); ax.set_xlim(0, 200); ax.set_xticks([])
save(f, OUT / "s19.png")

# s27 curtailment by ISO
f = fig("WHEN THE GRID SAYS 'NOT NOW'", "Wind curtailment in 2025, % of potential wind generation, by grid operator",
        "Source: Berkeley Lab / U.S. DOE, Land-Based Wind Energy Technology Data Update (2026). PJM data partial.")
ax = axes(f, (0.24, 0.12, 0.70, 0.68))
isos = ["SPP", "ERCOT", "MISO", "ISO-NE", "CAISO", "NYISO", "PJM*"][::-1]
val = [9.44, 4.73, 2.88, 1.51, 1.27, 1.07, 0.78][::-1]
ax.barh(isos, val, color=[RED if v > 9 else CYAN for v in val], height=0.62)
for y, v in enumerate(val):
    ax.text(v + 0.15, y, f"{v:.1f}%", va="center", fontproperties=ANTON, fontsize=34)
ax.axvline(5.07, color=AMBER, lw=3, ls="--"); ax.text(5.15, 6.45, "All seven: 5.1%", color=AMBER, fontsize=24, fontweight="bold")
ax.set_xlim(0, 11.5); ax.set_xticks([]); ax.tick_params(axis="y", labelsize=28)
save(f, OUT / "s27.png")

# s28 SPP trend
f = fig("MORE WIND, MORE CURTAILMENT", "Southwest Power Pool, 2014–2025",
        "Source: Berkeley Lab / U.S. DOE, Land-Based Wind Energy Technology Data Update (2026), data file.")
ax = axes(f, (0.08, 0.14, 0.80, 0.64))
yrs = list(range(2014, 2026))
cur = [0.71, 0.93, 1.66, 2.80, 1.29, 1.57, 2.53, 6.36, 9.22, 8.33, 10.53, 9.44]
shr = [11.97, 13.47, 17.54, 22.99, 23.83, 27.52, 31.27, 34.82, 37.95, 36.98, 38.20, 37.58]
ax.plot(yrs, shr, color=CYAN, lw=6, marker="o", ms=10, label="Wind share of load (%)")
ax2 = ax.twinx(); ax2.plot(yrs, cur, color=RED, lw=6, marker="o", ms=10)
ax.set_ylim(0, 45); ax2.set_ylim(0, 12)
ax.set_ylabel("wind share of load (%)", color=CYAN); ax2.set_ylabel("wind curtailed (%)", color=RED)
ax2.tick_params(colors=MUTED); ax2.spines["top"].set_visible(False)
ax.text(2014.2, 15, "12%", color=CYAN, fontproperties=ANTON, fontsize=34); ax.text(2024.4, 40.5, "38%", color=CYAN, fontproperties=ANTON, fontsize=34)
ax2.text(2014.2, 1.3, "0.7%", color=RED, fontproperties=ANTON, fontsize=34); ax2.text(2024.3, 7.9, "9.4%", color=RED, fontproperties=ANTON, fontsize=34)
ax.set_xticks([2014, 2016, 2018, 2020, 2022, 2024])
save(f, OUT / "s28.png")

# s33 bats
f = fig("SLOWING DOWN FOR BATS", "Bat deaths with low-wind curtailment vs. normal operation",
        "Source: Adams et al., PLOS ONE (2021): meta-analysis of 36 studies at 17 U.S. and Canadian wind farms.")
bars(f, ["Normal operation", "With curtailment"], [1.0, 0.37], ["100%", "37%  (−63%)"], colors=[CYAN, GREEN], ylim=1.3, fs=50)
save(f, OUT / "s33.png")

# s36 checklist
f = fig("SIX REASONS A TURBINE STANDS STILL", "", "Sources: see video description.")
ax = canvas(f)
items = [("Too little wind", "below cut-in speed", CYAN), ("Too much wind", "above cut-out speed", RED),
         ("The grid is full", "curtailment, negative prices", AMBER), ("Ice", "on the blades", WHITE),
         ("Wildlife", "bats and eagles", GREEN), ("Maintenance", "scheduled work", MUTED)]
for i, (a, b, col) in enumerate(items):
    x = 3 + (i % 2) * 49; y = 66 - (i // 2) * 30
    box(ax, x, y, 45, 22, "", color=col)
    ax.text(x + 4, y + 13, f"{i + 1}.  {a.upper()}", fontproperties=ANTON, fontsize=40, color=col, va="center")
    ax.text(x + 4, y + 5, b, fontsize=24, color=WHITE, va="center")
save(f, OUT / "s36.png")
