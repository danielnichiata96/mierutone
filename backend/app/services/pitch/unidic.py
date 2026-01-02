"""UniDic cross-validation support."""

from functools import lru_cache

import jaconv

# Optional UniDic support for cross-validation
try:
    import fugashi
    import unidic
    UNIDIC_AVAILABLE = True
except ImportError:
    UNIDIC_AVAILABLE = False


@lru_cache(maxsize=1)
def get_unidic_tagger():
    """Get cached UniDic/fugashi tagger instance for cross-validation."""
    if not UNIDIC_AVAILABLE:
        return None
    try:
        return fugashi.Tagger(f'-d "{unidic.DICDIR}"')
    except Exception:
        return None


def lookup_unidic_accent(surface: str, reading_hira: str) -> int | None:
    """Look up pitch accent from UniDic via fugashi.

    UniDic provides aType (accent type) for words. This serves as a
    secondary source for cross-validation with Kanjium.

    Returns:
        Accent type (int) or None if not found/unavailable.
    """
    tagger = get_unidic_tagger()
    if not tagger:
        return None

    try:
        # Tokenize the surface form
        tokens = list(tagger(surface))
        if not tokens:
            return None

        # For single-token words, get the accent directly
        if len(tokens) == 1:
            token = tokens[0]
            # aType is the accent type field in UniDic
            atype = getattr(token.feature, 'aType', None)
            if atype is not None and atype != '*':
                # aType can be comma-separated for multiple patterns
                first_value = str(atype).split(',')[0].strip()
                try:
                    return int(first_value)
                except ValueError:
                    return None

        # For multi-token results, try to find a match by reading
        for token in tokens:
            token_reading = getattr(token.feature, 'kana', None)
            if token_reading:
                token_reading_hira = jaconv.kata2hira(token_reading)
                if token_reading_hira == reading_hira:
                    atype = getattr(token.feature, 'aType', None)
                    if atype is not None and atype != '*':
                        first_value = str(atype).split(',')[0].strip()
                        try:
                            return int(first_value)
                        except ValueError:
                            continue
    except Exception:
        # Don't let UniDic errors break the main flow
        pass

    return None
