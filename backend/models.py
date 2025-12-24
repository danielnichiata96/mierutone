from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str


class MoraInfo(BaseModel):
    mora: str
    pitch: str  # "H" (high) or "L" (low)


class WordPitch(BaseModel):
    surface: str  # Original text (kanji/kana)
    reading: str  # Hiragana reading
    accent_type: int | None  # aType: position where pitch drops (0=heiban)
    mora_count: int
    pitch_pattern: list[str]  # ["L", "H", "H", "L"] per mora
    part_of_speech: str


class AnalyzeResponse(BaseModel):
    text: str
    words: list[WordPitch]
