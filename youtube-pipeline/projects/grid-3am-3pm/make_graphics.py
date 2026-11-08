#!/usr/bin/env python3
"""Own graphics for 'Where Your Power Comes From at 3 A.M. vs. 3 P.M.' (The Hidden Grid).
Data: EIA-930 via EIA API v2 (pipeline/eia_fetch.py) + figures quoted in sources.md.
Output: build/graphics/sNN.png (1920x1080). EIA hours are hour-ending; points are plotted at
the middle of each hour."""
import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

HERE = Path(__file__).resolve().parent
OUT = HERE / "build" / "graphics"
DATA = OUT / "data"
FONT = HERE.parent.parent / "assets" / "Anton-Regular.ttf"
font_manager.fontManager.addfont(str(FONT))
ANTON = font_manager.FontProperties(fname=str(FONT))

BG, PANEL, GRIDC = "#080e1c", "#0e1830", "#1c2a48"
CYAN, AMBER, WHITE, MUTED, RED = "#46beff", "#ffc400", "#ffffff", "#9fb0c8", "#ff6b4a"
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": WHITE, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": MUTED, "axes.edgecolor": GRIDC,
                     "font.size": 20})

HOURS = [h - 0.5 for h in range(1, 25)]          # hour-ending -> middle of hour (0..24 axis)
TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]
TLABELS = ["12 a.m.", "3 a.m.", "6 a.m.", "9 a.m.", "Noon", "3 p.m.", "6 p.m.", "9 p.m.", "12 a.m."]


def he(series):
    """dict hour(0-23, hour-ending label) -> list ordered by hour-ending 1..24"""
    s = {int(k): v for k, v in series.items()}
    return [s[h % 24] for h in range(1, 25)]


def fig(title, subtitle, source):
    f = plt.figure(figsize=(19.2, 10.8), dpi=100, facecolor=BG)
    f.text(0.06, 0.90, title, fontproperties=ANTON, fontsize=58, color=WHITE)
    if subtitle:
        f.text(0.06, 0.845, subtitle, fontsize=24, color=MUTED)
    f.text(0.06, 0.035, source, fontsize=15, color="#6f7f99")
    f.text(0.94, 0.035, "OTHER END OF THE WIRE", fontproperties=ANTON, fontsize=20, color=AMBER, ha="right")
    return f


def axes(f, rect=(0.08, 0.14, 0.86, 0.66)):
    ax = f.add_axes(rect, facecolor=BG)
    ax.grid(True, color=GRIDC, linewidth=1)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    return ax


def hour_axis(ax):
    ax.set_xlim(0, 24)
    ax.set_xticks(TICKS)
    ax.set_xticklabels(TLABELS)


def save(f, name):
    f.savefig(OUT / name, facecolor=BG)
    plt.close(f)
    print("  graphic", name)


agg = json.loads((DATA / "agg.json").read_text())
cai = json.loads((DATA / "caiso_apr.json").read_text())

# s04 U.S. demand over the day
dem = [v / 1000 for v in he(agg["us48_demand"])]
f = fig("U.S. ELECTRICITY USE OVER A DAY", "Lower 48 states, average of every hour in 2025 (Eastern time)",
        "Source: U.S. Energy Information Administration, Hourly Electric Grid Monitor (EIA-930). Our calculation.")
ax = axes(f); hour_axis(ax)
ax.plot(HOURS, dem, color=CYAN, linewidth=6)
ax.fill_between(HOURS, dem, min(dem) - 40, color=CYAN, alpha=0.12)
lo = dem.index(min(dem)); hi = dem.index(max(dem))
ax.scatter([HOURS[lo]], [dem[lo]], s=260, color=AMBER, zorder=5)
ax.annotate(f"Low point: ~{dem[lo]:.0f} GW\naround 5 a.m.", (HOURS[lo], dem[lo]), (HOURS[lo] + 1.2, dem[lo] - 28),
            color=AMBER, fontsize=26, fontweight="bold")
ax.scatter([HOURS[hi]], [dem[hi]], s=260, color=WHITE, zorder=5)
ax.annotate(f"Evening peak: ~{dem[hi]:.0f} GW", (HOURS[hi], dem[hi]), (HOURS[hi] - 9.5, dem[hi] + 6),
            color=WHITE, fontsize=26, fontweight="bold")
ax.set_ylim(min(dem) - 40, max(dem) + 35); ax.set_ylabel("Gigawatts")
save(f, "s04.png")

# s07 nuclear flat vs demand
nuc = [v / 1000 for v in he(agg["us48_nuclear"])]
f = fig("NUCLEAR DOESN'T CARE WHAT TIME IT IS", "Lower 48 states, 2025 hourly averages (Eastern time)",
        "Source: EIA Hourly Electric Grid Monitor (EIA-930). Our calculation.")
ax = axes(f); hour_axis(ax)
ax.plot(HOURS, dem, color=CYAN, linewidth=5, label="Total demand")
ax.fill_between(HOURS, nuc, 0, color=AMBER, alpha=0.85, label="Nuclear output")
ax.text(12, nuc[11] / 2, f"NUCLEAR: ~{sum(nuc) / 24:.0f} GW, EVERY HOUR", ha="center", va="center",
        fontproperties=ANTON, fontsize=40, color=BG)
ax.text(1, dem[0] + 15, "Total demand", color=CYAN, fontsize=26, fontweight="bold")
ax.set_ylim(0, max(dem) + 60); ax.set_ylabel("Gigawatts")
save(f, "s07.png")

# s09 SPP wind share by hour
sh = he(agg["spp_share"])
f = fig("WIND IS A NIGHT SHIFT WORKER", "Southwest Power Pool: share of demand covered by wind, 2025 average by hour (Central time)",
        "Source: EIA Hourly Electric Grid Monitor (EIA-930), wind generation / demand. Our calculation.")
ax = axes(f); hour_axis(ax)
ax.plot(HOURS, sh, color=CYAN, linewidth=6)
ax.fill_between(HOURS, sh, 0, color=CYAN, alpha=0.15)
ax.annotate("~46% at 2 a.m.", (HOURS[1], sh[1]), (HOURS[1] + 0.5, sh[1] + 5), color=AMBER, fontsize=30, fontweight="bold")
ax.annotate("~31% at noon", (HOURS[11], sh[11]), (HOURS[11] - 2, sh[11] - 9), color=WHITE, fontsize=30, fontweight="bold")
ax.text(15.2, 53, "Dec 28, 2025:\n~80% for 5 hours\nbefore dawn", color=AMBER, fontsize=24,
        bbox=dict(boxstyle="round,pad=0.5", fc=PANEL, ec=AMBER, lw=2))
ax.set_ylim(0, 70); ax.set_ylabel("Percent of demand")
save(f, "s09.png")

# s12 ERCOT noon solar
f = fig("TEXAS SOLAR AT NOON: DOUBLED", "Main Texas grid (ERCOT), average solar output between noon and 1 p.m., summer",
        "Source: U.S. Energy Information Administration, Today in Energy, Oct 24, 2025.")
ax = axes(f, (0.25, 0.14, 0.5, 0.64))
bars = ax.bar(["Summer 2023", "Summer 2025"], [12, 24], color=[CYAN, AMBER], width=0.55)
for b, v in zip(bars, [12, 24]):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.6, f"{v} GW", ha="center", fontproperties=ANTON, fontsize=54)
ax.set_ylim(0, 29); ax.set_yticks([]); ax.grid(False); ax.spines["left"].set_visible(False)
ax.tick_params(axis="x", labelsize=28)
save(f, "s12.png")

# s18 net load diagram (real CAISO April 2025 average)
d = [v / 1000 for v in he(cai["demand"])]; so = [max(0, v) / 1000 for v in he(cai["solar"])]
wi = [v / 1000 for v in he(cai["wind"])]; net = [a - b - c for a, b, c in zip(d, so, wi)]
f = fig("NET LOAD = DEMAND − WIND − SOLAR", "California grid operator (CAISO), average April day 2025 (Pacific time)",
        "Source: EIA Hourly Electric Grid Monitor (EIA-930), CAISO balancing area; utility-scale wind and solar only (rooftop solar not included). Our calculation.")
ax = axes(f); hour_axis(ax)
ax.stackplot(HOURS, net, wi, so, colors=["#2b4a7a", CYAN, AMBER], alpha=0.95,
             labels=["Net load: everything else must cover this", "Wind", "Solar"])
ax.plot(HOURS, d, color=WHITE, linewidth=4, label="Total demand")
ax.legend(loc="upper left", fontsize=20, facecolor=PANEL, edgecolor=GRIDC, labelcolor=WHITE)
ax.set_ylim(0, max(d) + 9); ax.set_ylabel("Gigawatts")
save(f, "s18.png")

# s19 duck curve
f = fig("THE DUCK CURVE", "California net load (demand minus wind and solar), average April day 2025",
        "Source: EIA Hourly Electric Grid Monitor (EIA-930), CAISO balancing area; utility-scale wind and solar only (rooftop solar not included). Our calculation.")
ax = axes(f); hour_axis(ax)
ax.plot(HOURS, net, color=AMBER, linewidth=7)
ax.fill_between(HOURS, net, 0, color=AMBER, alpha=0.12)
lo = net.index(min(net)); hi = max(range(lo, 24), key=lambda i: net[i])
ax.annotate(f"The belly: ~{net[lo]:.0f} GW", (HOURS[lo], net[lo]), (HOURS[lo] - 7.5, net[lo] - 2.5),
            color=WHITE, fontsize=28, fontweight="bold")
ax.annotate("", (HOURS[hi], net[hi]), (HOURS[lo] + 0.6, net[lo] + 0.5),
            arrowprops=dict(arrowstyle="->", color=RED, lw=5))
ax.text(HOURS[lo] - 0.4, net[hi] - 2.5,
        f"The neck: +{net[hi] - net[lo]:.0f} GW\nin {hi - lo} hours", color=RED, fontsize=28, fontweight="bold",
        ha="right")
ax.set_ylim(0, max(net) + 6); ax.set_ylabel("Gigawatts")
save(f, "s19.png")

# s24 batteries hour ending 8 p.m.
f = fig("CALIFORNIA'S BATTERIES AT 8 P.M.", "Average battery output in the hour ending at 8 p.m., CAISO market",
        "Source: CAISO Department of Market Monitoring, 2025 Annual Report on Market Issues and Performance.")
ax = axes(f, (0.25, 0.14, 0.5, 0.64))
bars = ax.bar(["2024", "2025"], [5700, 9100], color=[CYAN, AMBER], width=0.55)
for b, v in zip(bars, ["~5,700 MW", "~9,100 MW"]):
    ax.text(b.get_x() + b.get_width() / 2, b.get_height() + 250, v, ha="center", fontproperties=ANTON, fontsize=50)
ax.set_ylim(0, 11000); ax.set_yticks([]); ax.grid(False); ax.spines["left"].set_visible(False)
ax.tick_params(axis="x", labelsize=30)
save(f, "s24.png")

# s29 price swings card (numbers as quoted from LBNL)
f = fig("ONE AVERAGE, HUGE SWINGS", "U.S. wholesale electricity prices, 2023",
        "Source: Lawrence Berkeley National Laboratory, ReWEP 2024.1 technical brief (2024).")
cards = [("$36", "per MWh", "Average wholesale price,\nmajor U.S. markets", WHITE),
         ("> $500", "per MWh", "Some summer evenings\nin Texas", RED),
         ("< $0", "per MWh", "Sunny spring hours\nin California", CYAN)]
for i, (big, unit, label, col) in enumerate(cards):
    x = 0.07 + i * 0.30
    ax = f.add_axes((x, 0.18, 0.26, 0.58), facecolor=PANEL)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_color(col); s.set_linewidth(3)
    ax.text(0.5, 0.66, big, ha="center", va="center", fontproperties=ANTON, fontsize=96, color=col, transform=ax.transAxes)
    ax.text(0.5, 0.43, unit, ha="center", fontsize=24, color=MUTED, transform=ax.transAxes)
    ax.text(0.5, 0.15, label, ha="center", fontsize=25, color=WHITE, transform=ax.transAxes)
save(f, "s29.png")

# s33 negative prices
f = fig("NEGATIVE PRICES IN CALIFORNIA", "Share of intervals with negative prices, CAISO balancing area, day-ahead market",
        "Source: CAISO Department of Market Monitoring, 2025 Annual Report on Market Issues and Performance.")
ax = axes(f, (0.25, 0.14, 0.5, 0.64))
bars = ax.bar(["2024", "2025"], [8.8, 7.1], color=[CYAN, AMBER], width=0.55)
for b, v in zip(bars, [8.8, 7.1]):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.25, f"{v}%", ha="center", fontproperties=ANTON, fontsize=54)
ax.set_ylim(0, 11); ax.set_yticks([]); ax.grid(False); ax.spines["left"].set_visible(False)
ax.tick_params(axis="x", labelsize=30)
save(f, "s33.png")
