"""Test UniDic goshu field."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from fugashi import Tagger

tagger = Tagger()

# Test words of different origins
test_words = [
    "山",           # wago (yamato kotoba)
    "東京",         # kango (chinese origin)
    "コンピュータ",  # gairaigo (foreign)
    "食べる",       # wago verb
    "電話",         # kango
    "パン",         # gairaigo
    "水",           # wago
]

print("Testing goshu (word origin) field:\n")

for text in test_words:
    for word in tagger(text):
        surface = word.surface
        goshu = getattr(word.feature, "goshu", None)
        pos = getattr(word.feature, "pos1", None)

        print(f"{surface}:")
        print(f"  goshu: {goshu}")
        print(f"  pos: {pos}")

        # List all available features
        features = [f for f in dir(word.feature) if not f.startswith("_")]
        print(f"  available: {features[:10]}...")
        print()
