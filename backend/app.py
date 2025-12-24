"""PitchLab JP - Streamlit Frontend."""

import html
import re

import streamlit as st
from fugashi import Tagger

# Page config
st.set_page_config(
    page_title="PitchLab JP",
    page_icon="🎵",
    layout="wide",
)

RISO_CSS = """
<style>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap");

:root {
    --ink-black: #2a2a2a;
    --ink-coral: #ff99a0;
    --ink-cornflower: #82a8e5;
    --ink-mint: #99e6c9;
    --ink-sunflower: #ffc850;
    --paper-white: #f9f8f2;
    --paper-off: #efefe5;
    --color-background: var(--paper-white);
    --color-foreground: var(--ink-black);
    --primary-500: var(--ink-cornflower);
    --primary-300: #dae6f5;
    --secondary-500: var(--ink-mint);
    --secondary-300: #e0f5eb;
    --accent-500: var(--ink-coral);
    --accent-300: #ffe0e2;
    --energy-500: var(--ink-sunflower);
    --energy-300: #fff0cc;
    --pitch-high: var(--ink-coral);
    --pitch-low: var(--ink-cornflower);
    --font-mono: "JetBrains Mono", monospace;
    --font-sans: "Zen Kaku Gothic New", sans-serif;
    --font-display: "JetBrains Mono", monospace;
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --border-width: 2px;
    --border-color: var(--ink-black);
    --shadow-riso: 4px 4px 0 rgba(130, 168, 229, 0.55);
    --shadow-riso-hover: 6px 6px 0 rgba(130, 168, 229, 0.65);
    --shadow-riso-sm: 2px 2px 0 rgba(42, 42, 42, 0.1);
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

html, body, [class*="css"]  {
    font-family: var(--font-sans);
}

body {
    background-color: var(--color-background);
    color: var(--color-foreground);
}

::selection {
    background: var(--secondary-300);
    color: var(--ink-black);
}

.stApp {
    background-color: var(--paper-white);
    background-image:
        radial-gradient(circle at 12% 15%, rgba(153, 230, 201, 0.25), transparent 45%),
        radial-gradient(circle at 85% 10%, rgba(255, 153, 160, 0.2), transparent 50%),
        radial-gradient(circle at 80% 85%, rgba(130, 168, 229, 0.2), transparent 45%),
        radial-gradient(circle at 35% 78%, rgba(255, 200, 80, 0.16), transparent 45%);
    position: relative;
}

.stApp::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.08;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    z-index: 0;
}

.block-container {
    position: relative;
    z-index: 1;
    padding-top: 2.5rem;
    padding-bottom: 3rem;
    max-width: 1200px;
}

h1, h2, h3, h4, h5 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
    color: var(--ink-black);
}

a {
    color: var(--primary-500);
    text-decoration: none;
}

a:hover {
    color: var(--accent-500);
}

.hero {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0 0 2.5rem 0;
    border-bottom: 2px dashed rgba(42, 42, 42, 0.15);
    margin-bottom: 2rem;
}

.hero-top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.logo {
    position: relative;
    width: 46px;
    height: 28px;
}

.logo-dot {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    mix-blend-mode: multiply;
}

.logo-dot.primary { background: var(--ink-cornflower); left: 0; top: 2px; }
.logo-dot.accent { background: var(--ink-coral); left: 10px; top: 0; }
.logo-dot.energy { background: var(--ink-sunflower); left: 20px; top: 4px; }

.hero-badge {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    background: var(--energy-300);
    border: 2px solid rgba(255, 200, 80, 0.7);
    color: #a16207;
    box-shadow: var(--shadow-riso-sm);
}

.hero-title {
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    font-weight: 800;
    line-height: 0.95;
    margin: 0;
}

.hero-subtitle {
    font-size: 1.05rem;
    max-width: 640px;
    color: rgba(42, 42, 42, 0.72);
}

.section-title {
    font-family: var(--font-display);
    font-weight: 800;
    text-transform: uppercase;
    font-size: 1rem;
    letter-spacing: 0.14em;
    margin-bottom: 0.75rem;
    color: rgba(42, 42, 42, 0.8);
}

.helper {
    font-size: 0.9rem;
    color: rgba(42, 42, 42, 0.65);
    margin-top: 0.75rem;
}

.input-label {
    font-family: var(--font-mono);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
    margin-bottom: 0.4rem;
    color: rgba(42, 42, 42, 0.7);
}

div[data-testid="stForm"] {
    background: var(--paper-off);
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    box-shadow: var(--shadow-riso);
    position: relative;
    overflow: hidden;
}

div[data-testid="stForm"]::before {
    content: "";
    position: absolute;
    top: -20px;
    right: -18px;
    width: 120px;
    height: 120px;
    background-image: radial-gradient(rgba(130, 168, 229, 0.6) 1px, transparent 1px);
    background-size: 8px 8px;
    opacity: 0.18;
    transform: rotate(12deg);
}

div[data-testid="stForm"] > div {
    position: relative;
    z-index: 1;
}

div[data-testid="stTextArea"] textarea {
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--ink-black);
    background: #fffdf7;
    font-size: 1rem;
    line-height: 1.6;
    padding: 0.85rem;
    box-shadow: var(--shadow-riso-sm);
    font-family: var(--font-sans);
}

div[data-testid="stTextArea"] textarea:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 4px 4px 0 rgba(130, 168, 229, 0.4);
}

div.stButton > button {
    font-family: var(--font-mono);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--primary-500);
    color: var(--ink-black);
    border: var(--border-width) solid var(--primary-500);
    border-radius: var(--radius-md);
    padding: 0.6rem 1.3rem;
    box-shadow: var(--shadow-riso);
    transition: all 0.2s ease;
}

div.stButton > button:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-riso-hover);
}

div.stButton > button:active {
    transform: translate(1px, 1px);
    box-shadow: none;
}

div[data-testid="stExpander"] details {
    border-radius: var(--radius-md);
    border: var(--border-width) dashed rgba(42, 42, 42, 0.3);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: var(--shadow-riso-sm);
}

div[data-testid="stExpander"] summary {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(42, 42, 42, 0.7);
}

div[data-testid="stHtml"] iframe {
    border-radius: var(--radius-lg);
    border: var(--border-width) solid var(--ink-black);
    box-shadow: var(--shadow-riso);
    background: var(--paper-off);
}

div[data-testid="stAlert"] {
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--ink-black);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: var(--shadow-riso-sm);
}

.legend {
    background: rgba(255, 255, 255, 0.8);
    border: 2px dashed rgba(42, 42, 42, 0.3);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    font-size: 0.92rem;
}

.legend strong {
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.85rem;
}

.jp-text {
    font-family: "Zen Kaku Gothic New", var(--font-sans);
}
</style>
"""

st.markdown(RISO_CSS, unsafe_allow_html=True)

# Initialize tagger
@st.cache_resource
def get_tagger():
    return Tagger()

tagger = get_tagger()


def count_morae(reading: str) -> int:
    """Count morae in a Japanese reading."""
    if not reading:
        return 0
    small_kana = set("ゃゅょャュョぁぃぅぇぉァィゥェォ")
    return sum(1 for char in reading if char not in small_kana)


def get_pitch_pattern(accent_type: int | None, mora_count: int) -> list[str]:
    """Generate pitch pattern (H/L) based on accent type."""
    if mora_count == 0:
        return []
    if mora_count == 1:
        return ["H"] if accent_type == 1 else ["L"]
    if accent_type is None or accent_type < 0:
        accent_type = 0

    if accent_type == 0:
        return ["L"] + ["H"] * (mora_count - 1)
    elif accent_type == 1:
        return ["H"] + ["L"] * (mora_count - 1)
    else:
        pattern = ["L"]
        for i in range(2, mora_count + 1):
            pattern.append("H" if i <= accent_type else "L")
        return pattern


def parse_accent_type(atype_str: str | None) -> int | None:
    """Parse aType field from UniDic."""
    if not atype_str:
        return None
    first_value = atype_str.split(",")[0].strip()
    try:
        return int(first_value)
    except ValueError:
        return None


def kata_to_hira(text: str) -> str:
    """Convert katakana to hiragana."""
    result = []
    for char in text:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(char)
    return "".join(result)


def extract_reading(word) -> str:
    """Extract hiragana reading from word features."""
    if hasattr(word.feature, 'kana') and word.feature.kana:
        return kata_to_hira(word.feature.kana)
    if hasattr(word.feature, 'pron') and word.feature.pron:
        return kata_to_hira(word.feature.pron)
    if hasattr(word.feature, 'lemma') and word.feature.lemma:
        return word.feature.lemma
    return word.surface


def split_into_morae(reading: str) -> list[str]:
    """Split reading into individual morae."""
    morae = []
    small_kana = set("ゃゅょャュョぁぃぅぇぉァィゥェォ")
    i = 0
    while i < len(reading):
        char = reading[i]
        if i + 1 < len(reading) and reading[i + 1] in small_kana:
            morae.append(char + reading[i + 1])
            i += 2
        else:
            morae.append(char)
            i += 1
    return morae


def analyze_text(text: str) -> list[dict]:
    """Analyze Japanese text and return pitch data."""
    words_result = []
    for word in tagger(text):
        surface = word.surface
        if re.match(r'^[\s\u3000.,!?。、！？「」『』（）\(\)]+$', surface):
            continue

        reading = extract_reading(word)
        mora_count = count_morae(reading)
        atype_raw = word.feature.aType if hasattr(word.feature, 'aType') else None
        accent_type = parse_accent_type(atype_raw)
        pitch_pattern = get_pitch_pattern(accent_type, mora_count)
        morae = split_into_morae(reading)

        words_result.append({
            "surface": surface,
            "reading": reading,
            "morae": morae,
            "accent_type": accent_type,
            "mora_count": mora_count,
            "pitch_pattern": pitch_pattern,
        })
    return words_result


def render_pitch_html(words: list[dict]) -> str:
    """Generate HTML for pitch visualization."""
    html_output = """
    <style>
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap");

        :root {
            --ink-black: #2a2a2a;
            --ink-coral: #ff99a0;
            --ink-cornflower: #82a8e5;
            --paper-white: #f9f8f2;
            --paper-off: #efefe5;
            --pitch-high: var(--ink-coral);
            --pitch-low: var(--ink-cornflower);
            --shadow-riso: 4px 4px 0 rgba(130, 168, 229, 0.4);
        }

        .pitch-container {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            padding: 12px 6px;
            font-family: "Zen Kaku Gothic New", sans-serif;
        }
        .word-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 14px;
            background: var(--paper-off);
            border-radius: 16px;
            min-width: 120px;
            border: 2px solid var(--ink-black);
            box-shadow: var(--shadow-riso);
        }
        .svg-pitch {
            display: block;
            margin-bottom: 8px;
        }
        .surface {
            font-size: 18px;
            font-weight: 700;
            color: var(--ink-black);
        }
        .reading {
            font-size: 14px;
            color: rgba(42, 42, 42, 0.7);
            margin-top: 2px;
        }
        .accent-type {
            font-size: 12px;
            color: rgba(42, 42, 42, 0.65);
            margin-top: 6px;
            text-align: center;
        }
        .pattern {
            font-family: "JetBrains Mono", monospace;
            font-size: 12px;
            letter-spacing: 0.08em;
            color: rgba(42, 42, 42, 0.7);
            margin-top: 4px;
        }
        .jp-text {
            font-family: "Zen Kaku Gothic New", sans-serif;
        }
    </style>
    <div class="pitch-container">
    """

    import html as html_module
    for word in words:
        morae = word["morae"]
        pattern = word["pitch_pattern"]

        if not morae or not pattern:
            continue

        # Build SVG for pitch line
        svg_width = len(morae) * 30
        svg_height = 45
        points = []
        circles = []

        for i, pitch in enumerate(pattern):
            x = i * 30 + 15
            y = 10 if pitch == "H" else 35
            points.append(f"{x},{y}")
            dot_color = "var(--pitch-high)" if pitch == "H" else "var(--pitch-low)"
            circles.append(
                f'<circle cx="{x}" cy="{y}" r="5" fill="{dot_color}" stroke="var(--ink-black)" stroke-width="1.2" />'
            )

        polyline = (
            f'<polyline points="{" ".join(points)}" fill="none" stroke="var(--ink-black)" '
            'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
        )

        # Mora characters below
        mora_text = ""
        for i, mora in enumerate(morae):
            x = i * 30 + 15
            safe_mora = html_module.escape(mora)
            mora_text += (
                f'<text x="{x}" y="{svg_height + 20}" text-anchor="middle" '
                f'font-size="16" fill="var(--ink-black)">{safe_mora}</text>'
            )

        accent_label = format_accent_label(word["accent_type"], word["mora_count"])
        surface = html_module.escape(word["surface"])
        reading = html_module.escape(word["reading"])
        pattern_str = " ".join(pattern)

        html_output += f"""
        <div class="word-box">
            <svg class="svg-pitch" width="{svg_width}" height="{svg_height + 25}">
                {polyline}
                {''.join(circles)}
                {mora_text}
            </svg>
            <div class="surface jp-text">{surface}</div>
            <div class="reading jp-text">{reading}</div>
            <div class="pattern">{pattern_str}</div>
            <div class="accent-type">{accent_label}</div>
        </div>
        """

    html_output += "</div>"
    return html_output


def format_accent_label(accent_type: int | None, mora_count: int) -> str:
    """Format accent label with Japanese + English names."""
    if accent_type is None:
        return "Unknown accent"
    if accent_type == 0:
        label = "平板 (Heiban / flat)"
    elif accent_type == 1:
        label = "頭高 (Atamadaka / head-high)"
    elif accent_type == mora_count:
        label = "尾高 (Odaka / tail-high)"
    else:
        label = "中高 (Nakadaka / middle-high)"
    return f"Type {accent_type} · {label}"


# ===== UI =====
st.markdown(
    """
    <div class="hero">
        <div class="hero-top">
            <div class="logo">
                <span class="logo-dot primary"></span>
                <span class="logo-dot accent"></span>
                <span class="logo-dot energy"></span>
            </div>
            <div class="hero-badge">Japanese Pitch Accent</div>
        </div>
        <h1 class="hero-title">PitchLab JP</h1>
        <p class="hero-subtitle">
            A soft risograph take on pitch accent visualization. Paste Japanese text,
            analyze, and see the H/L staircase with readings and accent labels in
            Japanese + English.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

input_col, output_col = st.columns([1, 1.3], gap="large")

with input_col:
    st.markdown('<div class="section-title">Input</div>', unsafe_allow_html=True)
    with st.form("analysis_form"):
        st.markdown('<div class="input-label">Japanese text</div>', unsafe_allow_html=True)
        text = st.text_area(
            "",
            value="昨日は橋を渡って箸でご飯を食べました",
            height=120,
            placeholder="Type or paste Japanese here...",
            label_visibility="collapsed",
        )
        submitted = st.form_submit_button("Analyze Pitch")
    st.markdown(
        '<div class="helper">Example: 昨日は橋を渡って箸でご飯を食べました</div>',
        unsafe_allow_html=True,
    )

if "auto_run" not in st.session_state:
    st.session_state.auto_run = True

run_analysis = submitted
if st.session_state.auto_run and text.strip():
    run_analysis = True
    st.session_state.auto_run = False

with output_col:
    st.markdown('<div class="section-title">Pitch Visualization</div>', unsafe_allow_html=True)
    if run_analysis:
        if text.strip():
            words = analyze_text(text)
            if words:
                html_block = render_pitch_html(words)
                st.components.v1.html(html_block, height=320, scrolling=True)
                with st.expander("Word breakdown (H/L pattern)"):
                    for word in words:
                        pattern_str = "-".join(word["pitch_pattern"])
                        label = format_accent_label(word["accent_type"], word["mora_count"])
                        st.markdown(
                            f"**{word['surface']}** ({word['reading']}) → `{pattern_str}` · {label}"
                        )
            else:
                st.warning("No words found to analyze.")
        else:
            st.info("Enter Japanese text to analyze.")

st.markdown(
    """
    <div class="legend">
        <strong>Accent legend</strong><br/>
        Type 0: 平板 (Heiban / flat) - pitch rises then stays high.<br/>
        Type 1: 頭高 (Atamadaka / head-high) - starts high, drops after the first mora.<br/>
        Type N: 中高 (Nakadaka / middle-high) - drops after the Nth mora.<br/>
        Type N=last: 尾高 (Odaka / tail-high) - drops after the last mora (before a particle).
    </div>
    """,
    unsafe_allow_html=True,
)
