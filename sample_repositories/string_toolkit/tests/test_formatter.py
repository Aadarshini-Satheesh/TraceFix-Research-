import pytest
from toolkit.formatter import truncate_words, clean_whitespace

def test_truncate_words_short():
    assert truncate_words("hello world", 5) == "hello world"

def test_truncate_words_long():
    assert truncate_words("one two three four five six", 3) == "one two three..."

def test_truncate_empty():
    assert truncate_words("", 3) == ""

def test_clean_whitespace():
    assert clean_whitespace("  hello    world \t\n ") == "hello world"
