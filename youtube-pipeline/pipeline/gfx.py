"""Shared chart/diagram style for The Hidden Grid (1920x1080, dark navy, amber/cyan)."""
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

FONT = Path(__file__).resolve().parent.parent / "assets" / "Anton-Regular.ttf"
font_manager.fontManager.addfont(str(FONT))
ANTON = font_manager.FontProperties(fname=str(FONT))

BG, PANEL, GRIDC = "#080e1c", "#0e1830", "#1c2a48"
CYAN, AMBER, WHITE, MUTED, RED, GREEN = "#46beff", "#ffc400", "#ffffff", "#9fb0c8", "#ff6b4a", "#5fd38d"
plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": WHITE, "axes.labelcolor": MUTED,
                     "xtick.color": MUTED, "ytick.color": MUTED, "axes.edgecolor": GRIDC, "font.size": 20})


def fig(title, subtitle, source):
    f = plt.figure(figsize=(19.2, 10.8), dpi=100, facecolor=BG)
    f.text(0.06, 0.90, title, fontproperties=ANTON, fontsize=58, color=WHITE)
    if subtitle:
        f.text(0.06, 0.845, subtitle, fontsize=24, color=MUTED)
    f.text(0.06, 0.035, source, fontsize=15, color="#6f7f99")
    f.text(0.94, 0.035, "THE HIDDEN GRID", fontproperties=ANTON, fontsize=20, color=AMBER, ha="right")
    return f


def axes(f, rect=(0.08, 0.14, 0.86, 0.66)):
    ax = f.add_axes(rect, facecolor=BG)
    ax.grid(True, color=GRIDC, linewidth=1)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    return ax


def canvas(f, rect=(0.04, 0.10, 0.92, 0.72)):
    """Blank 0..100 x 0..100 drawing area for diagrams."""
    ax = f.add_axes(rect, facecolor=BG)
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis("off")
    return ax


def box(ax, x, y, w, h, text, color=CYAN, fs=22, fill=PANEL, tc=WHITE, bold=True):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6,rounding_size=1.2",
                                fc=fill, ec=color, lw=3))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, color=tc,
            fontweight="bold" if bold else "normal", wrap=True)


def arrow(ax, x0, y0, x1, y1, color=AMBER, lw=4):
    ax.add_patch(FancyArrowPatch((x0, y0), (x1, y1), arrowstyle="-|>", mutation_scale=28, color=color, lw=lw))


def bars(f, labels, values, texts, colors=None, ylim=None, rect=(0.22, 0.19, 0.56, 0.60), fs=54):
    ax = axes(f, rect)
    colors = colors or [CYAN, AMBER, GREEN, RED][:len(values)]
    b = ax.bar(labels, values, color=colors, width=0.55)
    top = ylim or max(values) * 1.2
    for r, t in zip(b, texts):
        ax.text(r.get_x() + r.get_width() / 2, r.get_height() + top * 0.02, t, ha="center",
                fontproperties=ANTON, fontsize=fs)
    ax.set_ylim(0, top); ax.set_yticks([]); ax.grid(False); ax.spines["left"].set_visible(False)
    ax.tick_params(axis="x", labelsize=28)
    return ax


def tiles(f, items, y=0.20, h=0.56):
    """items: list of (big, small, color)."""
    n = len(items); w = 0.86 / n
    for i, (big, small, col) in enumerate(items):
        ax = f.add_axes((0.07 + i * w + 0.01, y, w - 0.02, h), facecolor=PANEL)
        ax.set_xticks([]); ax.set_yticks([])
        for s in ax.spines.values():
            s.set_color(col); s.set_linewidth(3)
        ax.text(0.5, 0.60, big, ha="center", va="center", fontproperties=ANTON, fontsize=100 if len(big) < 5 else 80,
                color=col, transform=ax.transAxes)
        ax.text(0.5, 0.22, small, ha="center", va="center", fontsize=26, color=WHITE, transform=ax.transAxes)


def save(f, out):
    f.savefig(out, facecolor=BG)
    plt.close(f)
    print("  graphic", Path(out).name)
