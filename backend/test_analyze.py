"""Quick test script for the pitch analyzer with SudachiPy."""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from sudachipy import dictionary, tokenizer
import jaconv


def test_basic():
    tok = dictionary.Dictionary().create()
    mode = tokenizer.Tokenizer.SplitMode.C  # Keep compounds together

    test_phrases = [
        "昨日は肉を食べました",  # Yesterday I ate meat
        "橋を渡る",  # Cross the bridge (hashi = bridge)
        "箸を使う",  # Use chopsticks (hashi = chopsticks)
        "雨が降っています",  # It's raining
        "東京に行きたい",  # I want to go to Tokyo
        "国立博物館に行く",  # Go to National Museum (compound test)
        "東京都庁",  # Tokyo Metropolitan Government (compound test)
    ]

    print("=" * 60)
    print("MieruTone - SudachiPy Mode C Test")
    print("=" * 60)

    for phrase in test_phrases:
        print(f"\n>> {phrase}")
        print("-" * 40)

        for token in tok.tokenize(phrase, mode):
            surface = token.surface()
            reading_kata = token.reading_form()
            reading_hira = jaconv.kata2hira(reading_kata) if reading_kata else ""
            pos = token.part_of_speech()[0] if token.part_of_speech() else "?"
            lemma = token.dictionary_form()

            print(f"  {surface:12} | 読み: {reading_hira:12} | {pos:6} | lemma: {lemma}")

    print("\n" + "=" * 60)
    print("Mode C keeps compound words together!")
    print("Compare: 国立博物館 as one token vs 国立 + 博物館")
    print("=" * 60)


if __name__ == "__main__":
    test_basic()
