#!/usr/bin/env python3
"""
Block Puzzle - SVG Background Generator
Regenerates premium background SVGs for all 10 game themes.

Usage:
    python generate.py                    # regenerate all themes
    python generate.py jungle ocean       # regenerate specific themes (lowercase)

Each SVG is 800x600 viewBox, self-contained, valid SVG 1.1.
"""

import sys
import os
import random
import math

# ---------------------------------------------------------------------------
# Theme definitions (mirrors js/constants.js)
# ---------------------------------------------------------------------------
THEMES = {
    "jungle": {
        "name": "JUNGLE",
        "bg": "#081508", "gbg": "#0F2310",
        "sl": "#2E4820", "tm": "#D4B030", "ta": "#5DC940", "hi": "#90FF80",
        "dc": "#183810",
    },
    "desert": {
        "name": "DÉSERT",
        "bg": "#301C06", "gbg": "#422808",
        "sl": "#A07830", "tm": "#E8B838", "ta": "#E07820", "hi": "#FFE080",
        "dc": "#885018",
    },
    "ocean": {
        "name": "OCÉAN",
        "bg": "#040C28", "gbg": "#070F38",
        "sl": "#2868A8", "tm": "#50C8F0", "ta": "#28AAA0", "hi": "#A0F0FF",
        "dc": "#0C4888",
    },
    "volcan": {
        "name": "VOLCAN",
        "bg": "#180402", "gbg": "#240804",
        "sl": "#A83C0C", "tm": "#F08020", "ta": "#F03810", "hi": "#FFB060",
        "dc": "#901804",
    },
    "nuit": {
        "name": "NUIT",
        "bg": "#050312", "gbg": "#08051C",
        "sl": "#4828A8", "tm": "#A878F0", "ta": "#70B8F0", "hi": "#E0B0FF",
        "dc": "#380898",
    },
    "arctique": {
        "name": "ARCTIQUE",
        "bg": "#08121E", "gbg": "#0E1C2E",
        "sl": "#3878A8", "tm": "#88E0F8", "ta": "#60C0F0", "hi": "#C0F8FF",
        "dc": "#204C78",
    },
    "cosmos": {
        "name": "COSMOS",
        "bg": "#020008", "gbg": "#060012",
        "sl": "#380880", "tm": "#B040F0", "ta": "#6080F0", "hi": "#E0A0FF",
        "dc": "#200060",
    },
    "enchante": {
        "name": "ENCHANTÉ",
        "bg": "#030A06", "gbg": "#051008",
        "sl": "#148040", "tm": "#40F060", "ta": "#80F040", "hi": "#A0FFC0",
        "dc": "#0C3020",
    },
    "plage": {
        "name": "PLAGE",
        "bg": "#1C0804", "gbg": "#280C06",
        "sl": "#A03818", "tm": "#F09838", "ta": "#F05830", "hi": "#FFD080",
        "dc": "#782008",
    },
    "neopolis": {
        "name": "NÉOPOLIS",
        "bg": "#010510", "gbg": "#030C28",
        "sl": "#1A3888", "tm": "#00DDFF", "ta": "#A040FF", "hi": "#C0F0FF",
        "dc": "#081840",
    },
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hex_with_alpha(hex_color: str, alpha: float) -> str:
    """Return 'rgba(r,g,b,a)' from a hex color and 0-1 alpha."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha:.2f})"


def scatter_particles(n: int, colors: list, seed: int = 42) -> str:
    """Generate n SVG circle elements scattered across 800x600."""
    rng = random.Random(seed)
    lines = []
    for _ in range(n):
        x = round(rng.uniform(20, 780), 1)
        y = round(rng.uniform(20, 580), 1)
        r = round(rng.uniform(0.9, 2.3), 1)
        c = rng.choice(colors)
        lines.append(f'    <circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
    return "\n".join(lines)


def svg_header(uid: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg"\n'
        '     viewBox="0 0 800 600" width="100%" height="100%"\n'
        '     preserveAspectRatio="xMidYMid slice">\n'
    )


def svg_footer() -> str:
    return "</svg>\n"


def defs_block(uid: str, t: dict, extra_defs: str = "") -> str:
    bg, gbg, sl, tm, ta, hi = t["bg"], t["gbg"], t["sl"], t["tm"], t["ta"], t["hi"]
    return f"""  <defs>
    <radialGradient id="{uid}Base" cx="50%" cy="48%" r="68%">
      <stop offset="0%" stop-color="{gbg}"/>
      <stop offset="55%" stop-color="{bg}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="{bg}"/>
    </radialGradient>
    <linearGradient id="{uid}D1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{sl}" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="{bg}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="{sl}" stop-opacity="0.14"/>
    </linearGradient>
    <linearGradient id="{uid}D2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{tm}" stop-opacity="0.07"/>
      <stop offset="50%" stop-color="{ta}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="{tm}" stop-opacity="0.09"/>
    </linearGradient>
    <radialGradient id="{uid}Vig" cx="50%" cy="50%" r="70%">
      <stop offset="25%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.78"/>
    </radialGradient>
    <filter id="{uid}Blur">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
{extra_defs}  </defs>
"""


def base_layers(uid: str) -> str:
    return (
        f'  <rect width="800" height="600" fill="url(#{uid}Base)"/>\n'
        f'  <rect width="800" height="600" fill="url(#{uid}D1)"/>\n'
        f'  <rect width="800" height="600" fill="url(#{uid}D2)"/>\n'
    )


def vignette(uid: str) -> str:
    return f'  <rect width="800" height="600" fill="url(#{uid}Vig)"/>\n'


# ---------------------------------------------------------------------------
# Per-theme decorative element generators
# ---------------------------------------------------------------------------
def deco_jungle(t: dict) -> str:
    ta, tm = t["ta"], t["tm"]
    return f"""  <!-- Leaf curves -->
  <g opacity="0.18" fill="none" stroke="{ta}" stroke-width="1.1">
    <path d="M50,80 Q120,20 190,80 Q140,140 50,80Z"/>
    <path d="M640,50 Q720,110 680,175 Q610,140 640,50Z"/>
    <path d="M30,400 Q100,340 155,420 Q90,470 30,400Z"/>
    <path d="M695,350 Q760,298 782,378 Q732,420 695,350Z"/>
    <path d="M350,520 Q422,460 472,542 Q400,572 350,520Z"/>
    <path d="M0,200 C80,180 160,220 240,190 C320,160 400,200 480,170 C640,128 720,168 800,148" fill="none"/>
  </g>
  <g opacity="0.10" fill="none" stroke="{tm}" stroke-width="0.8">
    <path d="M240,100 Q310,50 350,110 Q300,160 240,100Z"/>
    <path d="M480,480 Q550,420 580,490 Q520,530 480,480Z"/>
  </g>
"""


def deco_desert(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Dune ripples -->
  <g opacity="0.22" fill="none" stroke="{tm}" stroke-width="1.0">
    <path d="M-20,500 Q150,380 300,450 Q450,520 600,430 Q720,360 820,420"/>
    <path d="M-20,540 Q200,420 380,490 Q520,540 700,460 Q760,430 820,460"/>
  </g>
  <g opacity="0.07" stroke="#FFE080" stroke-width="1.2" fill="none">
    <line x1="400" y1="-10" x2="100" y2="420"/>
    <line x1="400" y1="-10" x2="250" y2="430"/>
    <line x1="400" y1="-10" x2="400" y2="440"/>
    <line x1="400" y1="-10" x2="560" y2="430"/>
    <line x1="400" y1="-10" x2="720" y2="420"/>
  </g>
"""


def deco_ocean(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Wave curves -->
  <g opacity="0.20" fill="none" stroke="{tm}" stroke-width="1.2">
    <path d="M-20,150 C80,120 160,170 240,140 C320,110 400,160 480,130 C640,90 720,140 820,110"/>
    <path d="M-20,250 C60,230 140,270 220,245 C300,220 380,265 460,238 C620,202 720,252 820,222"/>
    <path d="M-20,380 C100,355 200,395 300,368 C400,342 480,385 580,358 C720,322 780,362 820,350"/>
    <path d="M-20,480 C120,460 240,495 360,470 C460,449 560,488 680,462 C750,448 780,458 820,455"/>
  </g>
  <g opacity="0.10" fill="none" stroke="{ta}" stroke-width="0.8">
    <path d="M-20,200 C80,185 160,210 240,195 C320,180 400,210 480,192 C640,168 720,198 820,188"/>
  </g>
"""


def deco_volcan(t: dict) -> str:
    ta, tm = t["ta"], t["tm"]
    return f"""  <!-- Lava cracks -->
  <g opacity="0.28" fill="none" stroke="{ta}" stroke-width="1.0">
    <path d="M400,600 L395,520 L405,460 L390,400 L400,340 L395,280"/>
    <path d="M200,600 L205,540 L195,480 L210,420 L198,360"/>
    <path d="M600,600 L605,530 L595,465 L608,395"/>
    <path d="M0,580 L50,560 L90,575 L140,555 L200,570"/>
    <path d="M800,575 L750,558 L700,570 L650,550 L580,568"/>
  </g>
  <g opacity="0.14" fill="none" stroke="#FFB060" stroke-width="0.7">
    <path d="M350,600 L360,530 L348,460 L362,380"/>
    <path d="M460,600 L452,525 L465,455 L450,390"/>
  </g>
"""


def deco_nuit(t: dict) -> str:
    tm, hi = t["tm"], t["hi"]
    return f"""  <!-- Constellation lines -->
  <g opacity="0.22" stroke="{tm}" stroke-width="0.7" fill="none">
    <polyline points="120,80 160,110 200,95 250,120 300,105"/>
    <line x1="300" y1="105" x2="340" y2="85"/>
    <line x1="340" y1="85" x2="380" y2="100"/>
    <polyline points="500,50 540,80 510,120 550,150 590,120"/>
    <line x1="590" y1="120" x2="630" y2="90"/>
    <polyline points="80,320 130,300 175,330 220,310"/>
    <line x1="175" y1="330" x2="180" y2="380"/>
    <polyline points="620,250 660,280 640,320 680,350 710,320"/>
  </g>
  <g opacity="0.55" fill="{hi}">
    <circle cx="120" cy="80"  r="2.0"/>
    <circle cx="200" cy="95"  r="1.8"/>
    <circle cx="300" cy="105" r="2.2"/>
    <circle cx="500" cy="50"  r="2.0"/>
    <circle cx="590" cy="120" r="2.0"/>
    <circle cx="175" cy="330" r="2.0"/>
    <circle cx="680" cy="350" r="1.8"/>
  </g>
"""


def deco_arctique(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Aurora borealis bands -->
  <g opacity="0.15" fill="none" stroke="{tm}" stroke-width="2.5">
    <path d="M-20,120 C100,80 200,140 350,100 C480,65 580,130 720,90 C760,80 790,85 820,80"/>
    <path d="M-20,160 C80,130 180,175 320,145 C450,118 560,160 700,130 C750,118 785,125 820,120"/>
  </g>
  <g opacity="0.10" fill="none" stroke="{ta}" stroke-width="1.5">
    <path d="M-20,95 C150,60 280,110 400,80 C530,50 650,105 820,70"/>
  </g>
  <g opacity="0.18" fill="{t['sl']}">
    <path d="M0,520 Q200,490 400,510 Q600,530 800,500 L800,600 L0,600 Z"/>
  </g>
"""


def deco_cosmos(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Spiral galaxy arms -->
  <g opacity="0.12" fill="none" stroke="{tm}" stroke-width="1.0">
    <path d="M400,300 C350,220 280,180 200,200 C140,215 110,270 140,330 C170,390 240,410 310,390"/>
    <path d="M400,300 C450,380 510,410 580,390 C640,372 660,310 630,250 C600,190 540,175 480,200"/>
  </g>
  <g opacity="0.07" fill="none" stroke="{ta}" stroke-width="0.7">
    <path d="M400,300 C340,260 290,240 240,270 C200,292 195,340 225,370 C260,405 320,400 370,375"/>
    <path d="M400,300 C460,340 500,360 530,340 C558,322 555,280 530,255 C500,225 460,230 430,258"/>
  </g>
"""


def deco_enchante(t: dict) -> str:
    tm, hi = t["tm"], t["hi"]
    return f"""  <!-- Magic rune circles -->
  <g opacity="0.14" fill="none" stroke="{hi}" stroke-width="0.7">
    <circle cx="200" cy="120" r="35"/>
    <circle cx="200" cy="120" r="22"/>
    <line x1="200" y1="85" x2="200" y2="155"/>
    <line x1="165" y1="120" x2="235" y2="120"/>
    <circle cx="600" cy="480" r="30"/>
    <circle cx="600" cy="480" r="18"/>
    <line x1="600" y1="450" x2="600" y2="510"/>
    <line x1="570" y1="480" x2="630" y2="480"/>
    <circle cx="700" cy="200" r="25"/>
    <circle cx="700" cy="200" r="15"/>
  </g>
  <!-- Firefly dots -->
  <g opacity="0.65">
    <circle cx="150" cy="200" r="2.5" fill="{tm}"/>
    <circle cx="320" cy="150" r="2.0" fill="{t['ta']}"/>
    <circle cx="480" cy="180" r="2.5" fill="{hi}"/>
    <circle cx="640" cy="220" r="2.0" fill="{tm}"/>
    <circle cx="250" cy="380" r="2.5" fill="{t['ta']}"/>
    <circle cx="550" cy="360" r="2.0" fill="{hi}"/>
  </g>
"""


def deco_plage(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Sunset waves -->
  <g opacity="0.22" fill="none" stroke="{tm}" stroke-width="1.0">
    <path d="M-20,420 Q100,400 200,415 Q300,430 400,410 Q500,390 600,408 Q700,425 820,405"/>
    <path d="M-20,460 Q120,440 240,455 Q360,470 480,452 Q600,435 720,450 Q770,458 820,448"/>
  </g>
  <g opacity="0.07" stroke="{t['hi']}" stroke-width="1.5" fill="none">
    <line x1="400" y1="15" x2="200" y2="280"/>
    <line x1="400" y1="15" x2="350" y2="310"/>
    <line x1="400" y1="15" x2="450" y2="310"/>
    <line x1="400" y1="15" x2="620" y2="280"/>
  </g>
  <g opacity="0.15" fill="{t['sl']}">
    <path d="M0,580 Q150,555 300,568 Q450,582 600,560 Q720,542 800,558 L800,600 L0,600 Z"/>
  </g>
"""


def deco_neopolis(t: dict) -> str:
    tm, ta = t["tm"], t["ta"]
    return f"""  <!-- Circuit traces -->
  <g opacity="0.30" fill="none" stroke="{tm}" stroke-width="0.9">
    <path d="M0,100 L120,100 L120,80 L280,80 L280,100 L400,100 L400,140 L520,140 L520,100 L680,100 L680,120 L800,120"/>
    <path d="M0,200 L80,200 L80,180 L200,180 L200,220 L360,220 L360,200 L500,200 L500,240 L640,240 L640,200 L800,200"/>
    <path d="M0,320 L160,320 L160,300 L300,300 L300,340 L460,340 L460,320 L600,320 L600,360 L720,360 L720,320 L800,320"/>
    <path d="M150,0 L150,80 L170,80 L170,200 L150,200 L150,320"/>
    <path d="M450,0 L450,100 L430,100 L430,220 L450,220 L450,360"/>
    <path d="M650,0 L650,80 L670,80 L670,200 L650,200 L650,320 L670,320 L670,440"/>
  </g>
  <g opacity="0.18" fill="none" stroke="{ta}" stroke-width="0.7">
    <path d="M0,150 L60,150 L60,130 L180,130 L180,170 L320,170 L320,150 L480,150 L480,170 L800,170"/>
    <path d="M250,0 L250,80 L270,80 L270,220 L250,220 L250,320 L270,320 L270,460"/>
  </g>
  <!-- Node dots -->
  <g opacity="0.55" fill="{tm}">
    <circle cx="120" cy="100" r="3.0"/>
    <circle cx="280" cy="80"  r="2.5"/>
    <circle cx="520" cy="100" r="3.0"/>
    <circle cx="200" cy="180" r="2.5"/>
    <circle cx="360" cy="220" r="3.0"/>
    <circle cx="460" cy="340" r="3.0"/>
    <circle cx="720" cy="320" r="2.5"/>
  </g>
  <g opacity="0.45" fill="{ta}">
    <circle cx="150" cy="80"  r="2.0"/>
    <circle cx="450" cy="100" r="2.0"/>
    <circle cx="250" cy="220" r="2.0"/>
    <circle cx="270" cy="320" r="2.0"/>
  </g>
"""


DECO_FN = {
    "jungle":   deco_jungle,
    "desert":   deco_desert,
    "ocean":    deco_ocean,
    "volcan":   deco_volcan,
    "nuit":     deco_nuit,
    "arctique": deco_arctique,
    "cosmos":   deco_cosmos,
    "enchante": deco_enchante,
    "plage":    deco_plage,
    "neopolis": deco_neopolis,
}

# ---------------------------------------------------------------------------
# SVG builder
# ---------------------------------------------------------------------------
def build_svg(key: str) -> str:
    t = THEMES[key]
    uid = key[:3]
    particles = scatter_particles(20, [t["sl"], t["tm"], t["ta"], t["hi"]], seed=hash(key) & 0xFFFF)
    deco = DECO_FN[key](t)

    return (
        svg_header(uid)
        + defs_block(uid, t)
        + base_layers(uid)
        + deco
        + f"  <!-- Ambient particles -->\n  <g opacity=\"0.52\">\n{particles}\n  </g>\n"
        + vignette(uid)
        + svg_footer()
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(THEMES.keys())

    for key in targets:
        key = key.lower().replace("é", "e").replace("è", "e")
        if key not in THEMES:
            print(f"  Unknown theme: {key!r} — skipped. Valid: {', '.join(THEMES)}")
            continue
        svg_content = build_svg(key)
        fname = f"bg_{key}.svg"
        fpath = os.path.join(out_dir, fname)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(svg_content)
        size_kb = len(svg_content.encode("utf-8")) / 1024
        print(f"  {fname:35s}  {size_kb:.1f} KB")

    print(f"\nDone. {len(targets)} file(s) written to {out_dir}")


if __name__ == "__main__":
    main()
