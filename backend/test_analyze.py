"""Quick test script for the pitch analyzer."""

from fugashi import Tagger


def test_basic():
    tagger = Tagger()

    test_phrases = [
        "昨日は肉を食べました",  # Yesterday I ate meat
        "橋を渡る",  # Cross the bridge (hashi = bridge, accent type 2)
        "箸を使う",  # Use chopsticks (hashi = chopsticks, accent type 1)
        "雨が降っています",  # It's raining
        "東京に行きたい",  # I want to go to Tokyo
    ]

    print("=" * 60)
    print("PitchLab JP - Pitch Accent Test")
    print("=" * 60)

    for phrase in test_phrases:
        print(f"\n>> {phrase}")
        print("-" * 40)

        for word in tagger(phrase):
            surface = word.surface

            # Get reading
            reading = ""
            if hasattr(word.feature, 'kana') and word.feature.kana:
                reading = word.feature.kana
            elif hasattr(word.feature, 'pron') and word.feature.pron:
                reading = word.feature.pron

            # Get accent type
            atype = None
            if hasattr(word.feature, 'aType') and word.feature.aType:
                atype = word.feature.aType

            # Get POS
            pos = word.feature.pos1 if hasattr(word.feature, 'pos1') else "?"

            print(f"  {surface:8} | 読み: {reading:10} | aType: {str(atype):6} | {pos}")

    print("\n" + "=" * 60)
    print("aType meanings:")
    print("  0 = Heiban (平板): L-H-H-H... stays high")
    print("  1 = Atamadaka (頭高): H-L-L-L... drops after 1st")
    print("  N = Drops after Nth mora")
    print("=" * 60)


if __name__ == "__main__":
    test_basic()
