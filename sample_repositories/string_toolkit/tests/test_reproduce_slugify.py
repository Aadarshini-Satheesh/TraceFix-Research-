import pytest
from toolkit.formatter import slugify

def test_slugify_consecutive_separators_and_boundary_stripping():
    # Input with leading/trailing punctuation and multiple spaces/symbols
    # Expected: "hello-world-2026", but buggy code returns "-hello---world---2026-"
    result = slugify("--- Hello, World!!! 2026 ---")
    assert result == "hello-world-2026", f"Expected 'hello-world-2026' but got '{result}'"

def test_slugify_accented_characters():
    result = slugify("Café au Lait & Thé")
    assert result == "cafe-au-lait-the", f"Expected 'cafe-au-lait-the' but got '{result}'"
