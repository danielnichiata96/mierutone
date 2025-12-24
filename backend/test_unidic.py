"""Explore all UniDic fields."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from fugashi import Tagger

tagger = Tagger()

# Test with a verb to see conjugation info
test = "食べました"

print("All UniDic fields for:", test)
print("=" * 50)

for word in tagger(test):
    print(f"\n{word.surface}:")
    for attr in dir(word.feature):
        if not attr.startswith("_"):
            val = getattr(word.feature, attr, None)
            if val and not callable(val):
                print(f"  {attr}: {val}")
