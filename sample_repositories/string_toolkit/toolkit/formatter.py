"""
String Toolkit: Utility functions for text transformations, normalization, and slugification.
"""
import re
import unicodedata

def truncate_words(text: str, max_words: int, suffix: str = "...") -> str:
    """Truncates text after max_words words."""
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + suffix

def clean_whitespace(text: str) -> str:
    """Collapses multiple whitespace characters into a single space and strips boundaries."""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def slugify(text: str, separator: str = "-") -> str:
    """
    Converts a string into a URL-friendly slug.
    Normalizes unicode, converts to lowercase, replaces non-alphanumeric chars with separator,
    and strips leading/trailing separators.
    
    NOTE: Contains a known bug where consecutive separators are not collapsed properly
    when custom punctuation occurs, and leading/trailing separators can remain.
    """
    if not text:
        return ""
    # Normalize unicode characters (e.g. café -> cafe)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    # BUG: Faulty replacement logic that introduces duplicate separators and fails edge-stripping
    result = re.sub(r'[^a-z0-9]+', separator, text)
    # Missing proper boundary strip: only strips space instead of separator!
    return result.strip()
