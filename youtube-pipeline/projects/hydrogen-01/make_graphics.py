#!/usr/bin/env python3
"""Own graphics for 'Hydrogen: Where It Makes Sense and Where It DOESN'T'. Data: see sources.md, '## Graphics data'."""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "pipeline"))
from gfx import *  # noqa

OUT = HERE / "build" / "graphics"
OUT.mkdir(parents=True, exist_ok=True)

# s01 round trip
f = fig("STORE 100, GET BACK…", "Electricity returned per 100 units stored",
        "Sources: NREL ARIES megawatt-scale hydrogen test (2024); U.S. EIA, utility-scale battery fleet (2019).")
bars(f, ["Hydrogen system\nfull power (2024)", "Hydrogen system\nlow power (2024)", "Grid batteries\n(2019)"],
     [28.3, 35.1, 82], ["28", "35", "82"], colors=[RED, AMBER, GREEN], ylim=100, rect=(0.14, 0.19, 0.72, 0.60))
save(f, OUT / "s01.png")

# s09 production donut
f = fig("WHERE U.S. HYDROGEN COMES FROM", "About 10 million metric tons produced per year",
        "Source: U.S. DOE Hydrogen and Fuel Cell Technologies Office.")
ax = f.add_axes((0.08, 0.10, 0.45, 0.74)); ax.set_facecolor(BG)
ax.pie([95, 5], colors=[AMBER, CYAN], startangle=90, counterclock=False, wedgeprops=dict(width=0.32, edgecolor=BG, linewidth=4))
ax.text(0, 0, "~10 Mt\nper year", ha="center", va="center", fontproperties=ANTON, fontsize=46, color=WHITE)
f.text(0.58, 0.58, "95%", fontproperties=ANTON, fontsize=110, color=AMBER)
f.text(0.58, 0.50, "from natural gas (reforming)", fontsize=30, color=WHITE)
f.text(0.58, 0.32, "5%", fontproperties=ANTON, fontsize=80, color=CYAN)
f.text(0.58, 0.26, "other routes", fontsize=30, color=WHITE)
save(f, OUT / "s09.png")

# s10 SMR diagram
f = fig("HOW MOST HYDROGEN IS MADE TODAY", "Steam-methane reforming",
        "Sources: U.S. DOE Hydrogen and Fuel Cell Technologies Office; U.S. EIA (process temperature).")
ax = canvas(f)
box(ax, 2, 56, 28, 26, "NATURAL GAS\n+ STEAM\n1,300–1,800 °F", color=AMBER, fs=24)
box(ax, 37, 56, 26, 26, "CH₄ + H₂O\n→ CO + 3 H₂", color=CYAN, fs=28)
box(ax, 70, 56, 28, 26, "SHIFT\nCO + H₂O\n→ CO₂ + H₂", color=CYAN, fs=26)
arrow(ax, 30.8, 69, 36.2, 69); arrow(ax, 63.8, 69, 69.2, 69)
arrow(ax, 84, 55, 84, 42)
box(ax, 56, 14, 40, 26, "CLEAN-UP\nCO₂ and impurities removed\n→ HYDROGEN", color=GREEN, fs=24)
ax.text(4, 30, "Step 1: reforming\nStep 2: water-gas shift\nStep 3: purification", fontsize=26, color=MUTED, va="center")
save(f, OUT / "s10.png")

# s15 electrolyzer
f = fig("ELECTROLYSIS: ELECTRICITY IN, HYDROGEN OUT", "PEM electrolyzer system, electricity per kg of hydrogen (energy kept)",
        "Source: U.S. DOE Hydrogen and Fuel Cell Technologies Office, technical targets for PEM electrolysis.")
bars(f, ["2022 status", "2026 target", "Ultimate target"], [55, 51, 46], ["55 kWh\n(61%)", "51 kWh\n(65%)", "46 kWh\n(72%)"],
     colors=[RED, AMBER, GREEN], ylim=78, rect=(0.14, 0.19, 0.72, 0.60), fs=42)
save(f, OUT / "s15.png")

# s20 stations (log scale)
f = fig("WHERE CAN YOU FILL UP?", "U.S. public fueling locations, data as of Nov. 7, 2026 (log scale)",
        "Source: U.S. DOE Alternative Fuels Data Center. EV count excludes residential chargers.")
ax = axes(f, (0.30, 0.20, 0.62, 0.56))
ax.barh([1, 0], [44, 83972], color=[AMBER, CYAN], height=0.5)
ax.set_xscale("log"); ax.set_xlim(1, 1e6)
ax.set_yticks([1, 0]); ax.set_yticklabels(["Hydrogen\nstations", "EV charging\nlocations"], fontsize=28)
ax.text(60, 1, "44  (42 in California)", va="center", fontproperties=ANTON, fontsize=40, color=AMBER)
ax.text(1.2e5, 0, "83,972", va="center", fontproperties=ANTON, fontsize=44, color=CYAN)
save(f, OUT / "s20.png")

# s22 heat pump vs electrolysis
f = fig("ONE UNIT OF ELECTRICITY, TWO PATHS", "Heating a home",
        "Sources: U.S. DOE Energy Saver Guide (2022); U.S. DOE PEM electrolyzer status (2022).")
ax = canvas(f)
box(ax, 2, 40, 22, 22, "1 UNIT OF\nELECTRICITY", color=WHITE, fs=28)
arrow(ax, 25, 56, 44, 70, color=GREEN); arrow(ax, 25, 46, 44, 30, color=RED)
box(ax, 45, 60, 26, 20, "HEAT PUMP", color=GREEN, fs=30); box(ax, 45, 20, 26, 20, "ELECTROLYSIS", color=RED, fs=30)
ax.text(76, 74, "up to 3", fontproperties=ANTON, fontsize=70, color=GREEN); ax.text(76, 63, "units of heat", fontsize=26, color=WHITE)
ax.text(76, 34, "~0.61", fontproperties=ANTON, fontsize=70, color=RED)
ax.text(76, 18, "units of energy in hydrogen,\nbefore compression, delivery\nand burner losses", fontsize=20, color=WHITE)
save(f, OUT / "s22.png")

# s25 global demand
f = fig("WHERE HYDROGEN IS ACTUALLY USED", "Global hydrogen demand, 2024 (million metric tons)",
        "Source: IEA, Global Hydrogen Review 2025. New applications: less than 1% of total demand.")
ax = axes(f, (0.10, 0.14, 0.82, 0.64))
ax.bar([0], [43], color=CYAN, width=0.55)
bottom = 0
for share, lab, col in [(0.6, "Ammonia ~60%", AMBER), (0.3, "Methanol ~30%", GREEN), (0.1, "Steel ~10%", RED)]:
    ax.bar([1], [55 * share], bottom=[bottom], color=col, width=0.55)
    ax.text(1.32, bottom + 55 * share / 2, lab, va="center", fontsize=26, color=col, fontweight="bold")
    bottom += 55 * share
ax.text(0, 44.5, ">43 Mt", ha="center", fontproperties=ANTON, fontsize=48); ax.text(1, 56.5, "55 Mt", ha="center", fontproperties=ANTON, fontsize=48)
ax.set_xticks([0, 1]); ax.set_xticklabels(["Oil refining", "Industry"], fontsize=30)
ax.set_xlim(-0.6, 2.0); ax.set_ylim(0, 68); ax.set_yticks([]); ax.grid(False); ax.spines["left"].set_visible(False)
save(f, OUT / "s25.png")

# s34 DOE goals
f = fig("AMERICA'S HYDROGEN BET", "DOE clean-hydrogen goals, million metric tons per year",
        "Source: U.S. DOE National Clean Hydrogen Strategy and Roadmap (2023); DOE Hydrogen and Fuel Cell Technologies Office.")
ax = bars(f, ["2030", "2040", "2050"], [10, 20, 50], ["10", "20", "50"], colors=[CYAN, AMBER, GREEN], ylim=60,
          rect=(0.14, 0.19, 0.72, 0.60))
ax.axhline(10, color=WHITE, lw=3, ls="--")
ax.text(-0.35, 40, "Dashed line = today:\n~10 Mt total U.S. production,\n~95% from natural gas", ha="left", fontsize=24, color=WHITE)
save(f, OUT / "s34.png")
