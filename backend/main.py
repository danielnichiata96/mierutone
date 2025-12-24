from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fugashi import Tagger
import re

from models import AnalyzeRequest, AnalyzeResponse, WordPitch

app = FastAPI(
    title="PitchLab JP API",
    description="Japanese pitch accent analyzer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MeCab tagger with UniDic
tagger = Tagger()


def count_morae(reading: str) -> int:
    """Count morae in a Japanese reading.

    Small kana (ゃゅょぁぃぅぇぉ) don't count as separate morae.
    Long vowel mark (ー) counts as one mora.
    """
    if not reading:
        return 0

    small_kana = set("ゃゅょャュョぁぃぅぇぉァィゥェォ")
    count = 0

    for char in reading:
        if char not in small_kana:
            count += 1

    return count


def get_pitch_pattern(accent_type: int | None, mora_count: int) -> list[str]:
    """Generate pitch pattern (H/L) based on accent type.

    Japanese pitch accent rules:
    - Type 0 (Heiban/平板): L-H-H-H... (rises and stays high)
    - Type 1 (Atamadaka/頭高): H-L-L-L... (starts high, drops after 1st)
    - Type N (Nakadaka/中高 or Odaka/尾高): L-H-...-H-L (drops after Nth mora)

    Note: First mora is typically L, second is H (except for Type 1)
    """
    if mora_count == 0:
        return []

    if mora_count == 1:
        # Single mora words: typically H for Type 1, L for Type 0
        return ["H"] if accent_type == 1 else ["L"]

    if accent_type is None or accent_type < 0:
        # Unknown accent - default to heiban pattern
        accent_type = 0

    pattern = []

    if accent_type == 0:
        # Heiban: L-H-H-H...
        pattern = ["L"] + ["H"] * (mora_count - 1)
    elif accent_type == 1:
        # Atamadaka: H-L-L-L...
        pattern = ["H"] + ["L"] * (mora_count - 1)
    else:
        # Nakadaka/Odaka: L-H-H-...-H-L (drop after accent_type mora)
        pattern = ["L"]
        for i in range(2, mora_count + 1):
            if i <= accent_type:
                pattern.append("H")
            else:
                pattern.append("L")

    return pattern


def parse_accent_type(atype_str: str | None) -> int | None:
    """Parse aType field from UniDic.

    aType can be:
    - A number like "0", "1", "2"
    - Multiple values like "0,1" (first is most common)
    - None or empty
    """
    if not atype_str:
        return None

    # Take first value if comma-separated
    first_value = atype_str.split(",")[0].strip()

    try:
        return int(first_value)
    except ValueError:
        return None


def extract_reading(word) -> str:
    """Extract hiragana reading from word features."""
    # Try different fields that might contain the reading
    if hasattr(word.feature, 'kana') and word.feature.kana:
        return kata_to_hira(word.feature.kana)
    if hasattr(word.feature, 'pron') and word.feature.pron:
        return kata_to_hira(word.feature.pron)
    if hasattr(word.feature, 'lemma') and word.feature.lemma:
        return word.feature.lemma
    return word.surface


def kata_to_hira(text: str) -> str:
    """Convert katakana to hiragana."""
    result = []
    for char in text:
        code = ord(char)
        # Katakana range: 0x30A0-0x30FF -> Hiragana: 0x3040-0x309F
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(char)
    return "".join(result)


def get_pos(word) -> str:
    """Extract part of speech from word features."""
    if hasattr(word.feature, 'pos1') and word.feature.pos1:
        return word.feature.pos1
    return word.pos.split(",")[0] if word.pos else "Unknown"


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """Analyze Japanese text and return pitch accent information."""

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    words_result = []

    for word in tagger(request.text):
        surface = word.surface

        # Skip punctuation and whitespace
        if re.match(r'^[\s\u3000.,!?。、！？「」『』（）\(\)]+$', surface):
            continue

        reading = extract_reading(word)
        mora_count = count_morae(reading)

        # Get accent type from UniDic
        atype_raw = None
        if hasattr(word.feature, 'aType'):
            atype_raw = word.feature.aType

        accent_type = parse_accent_type(atype_raw)
        pitch_pattern = get_pitch_pattern(accent_type, mora_count)

        words_result.append(WordPitch(
            surface=surface,
            reading=reading,
            accent_type=accent_type,
            mora_count=mora_count,
            pitch_pattern=pitch_pattern,
            part_of_speech=get_pos(word),
        ))

    return AnalyzeResponse(
        text=request.text,
        words=words_result,
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "pitchlab-jp"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
