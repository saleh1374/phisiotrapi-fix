"""Translation + categorization services for the auto news reader."""
import os

from .models import NewsFeed

CATEGORY_KEYWORDS = {
    NewsFeed.Category.TECH: ["technology", "device", "robot", "app", "digital", "wearable", "تکنولوژی", "دستگاه"],
    NewsFeed.Category.CONFERENCE: ["conference", "congress", "symposium", "workshop", "همایش", "کنگره"],
    NewsFeed.Category.METHODS: ["new method", "protocol", "technique", "innovation", "approach", "متد", "روش"],
    # Everything else falls into clinical research.
}

TRANSLATION_KEYWORDS = {
    "back pain": "کمردرد",
    "knee": "زانو",
    "neck": "گردن",
    "shoulder": "شانه",
    "rehabilitation": "توانبخشی",
    "physiotherapy": "فیزیوتراپی",
    "physical therapy": "فیزیوتراپی",
    "exercise": "تمرین",
    "stroke": "سکته مغزی",
    "pain": "درد",
    "patients": "بیماران",
    "study": "مطالعه",
    "research": "پژوهش",
    "treatment": "درمان",
    "therapy": "درمان",
    "improves": "بهبود می‌بخشد",
    "reduces": "کاهش می‌دهد",
    "walking": "راه رفتن",
    "balance": "تعادل",
    "muscle": "عضله",
    "joint": "مفصل",
    "chronic": "مزمن",
    "new": "جدید",
    "shows": "نشان می‌دهد",
    "found": "یافت شد",
    "effective": "موثر",
    "significantly": "به‌طور قابل توجهی",
    "women": "زنان",
    "older adults": "سالمندان",
    "program": "برنامه",
    "results": "نتایج",
}


def categorize(text: str) -> str:
    """Classify an article into a news category based on keywords."""
    lowered = (text or "").lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return category
    # Default to clinical research for physiotherapy content
    physio_terms = ["physio", "rehabilitation", "exercise", "therapy", "treatment"]
    if any(term in lowered for term in physio_terms):
        return NewsFeed.Category.CLINICAL
    return NewsFeed.Category.CLINICAL


def translate_text(text: str) -> str:
    """Translate a short text (title/summary) to fluent Persian.

    Pluggable backends:
      - If GOOGLE_TRANSLATE_API_KEY is set, calls the Google Cloud Translation API.
      - If GEMINI_API_KEY is set, calls the Gemini API.
      - Otherwise falls back to a keyword-based dictionary translation
        (deterministic, no external dependency — perfect for development).
    """
    google_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if google_key:
        try:
            return _translate_google(text, google_key)
        except Exception:
            pass
    if gemini_key:
        try:
            return _translate_gemini(text, gemini_key)
        except Exception:
            pass
    return _translate_dictionary(text)


def _translate_google(text: str, api_key: str) -> str:
    import requests

    resp = requests.post(
        "https://translation.googleapis.com/language/translate/v2",
        params={"key": api_key},
        json={"q": text, "target": "fa", "format": "text"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["data"]["translations"][0]["translatedText"]


def _translate_gemini(text: str, api_key: str) -> str:
    import requests

    resp = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        params={"key": api_key},
        json={
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "Translate the following English medical/physiotherapy text into "
                                "fluent, natural Persian (Farsi). Keep medical terms accurate. "
                                f"Only output the translation:\n\n{text}"
                            )
                        }
                    ]
                }
            ]
        },
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def _translate_dictionary(text: str) -> str:
    """Deterministic keyword-based translation used when no API key exists."""
    lowered = (text or "").lower()
    result = text
    for en, fa in sorted(TRANSLATION_KEYWORDS.items(), key=lambda kv: -len(kv[0])):
        if en in lowered:
            result = result.replace(en, fa).replace(en.capitalize(), fa)
    return result


def enrich_article(entry: dict) -> dict:
    """Turn a raw RSS entry into a NewsFeed-ready payload."""
    title_en = entry.get("title", "").strip()
    summary_en = entry.get("summary", entry.get("description", "")).strip()
    
    # Clean HTML tags from summary
    import re
    summary_clean = re.sub(r'<[^>]+>', '', summary_en)[:500]

    title_fa = translate_text(title_en)
    summary_fa = translate_text(summary_clean)

    # Enhanced image extraction
    image_url = _extract_image(entry)

    from .models import NewsFeed

    return {
        "source_url": entry.get("link", "").strip(),
        "title_fa": title_fa or title_en,
        "title_en": title_en,
        "summary_fa": summary_fa,
        "image_url": image_url,
        "category": categorize(f"{title_en} {summary_clean}"),
    }


def _extract_image(entry: dict) -> str:
    """Extract image URL from RSS entry with multiple fallback strategies."""
    # Strategy 1: media_content (most common in RSS 2.0)
    media = entry.get("media_content") or entry.get("media_thumbnail")
    if media and isinstance(media, list) and media[0].get("url"):
        return media[0]["url"]
    
    # Strategy 2: enclosures (podcast/image attachments)
    enclosures = entry.get("enclosures", [])
    for enc in enclosures:
        if enc.get("type", "").startswith("image/"):
            return enc.get("href", enc.get("url", ""))
    
    # Strategy 3: media:thumbnail
    thumbnail = entry.get("media_thumbnail")
    if thumbnail and isinstance(thumbnail, list):
        return thumbnail[0].get("url", "")
    
    # Strategy 4: og:image or other meta tags in content
    content = entry.get("content", [{}])
    if isinstance(content, list) and content:
        content_html = content[0].get("value", "")
        # Extract first img tag
        import re
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_html)
        if img_match:
            return img_match.group(1)
    
    # Strategy 5: atom:link with type image
    links = entry.get("links", [])
    for link in links:
        if link.get("type", "").startswith("image/"):
            return link.get("href", "")
    
    # Strategy 6: summary contains img tag
    summary = entry.get("summary", "")
    if summary:
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
        if img_match:
            return img_match.group(1)
    
    # Strategy 7: Fetch og:image from article URL (with timeout)
    link = entry.get("link", "")
    if link:
        try:
            import requests
            from bs4 import BeautifulSoup
            resp = requests.get(link, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                og_image = soup.find("meta", property="og:image")
                if og_image and og_image.get("content"):
                    return og_image["content"]
                # Also try twitter:image
                twitter_img = soup.find("meta", name="twitter:image")
                if twitter_img and twitter_img.get("content"):
                    return twitter_img["content"]
                # Try first article image
                first_img = soup.find("article")
                if first_img:
                    img = first_img.find("img")
                    if img and img.get("src"):
                        return img["src"]
        except Exception:
            pass
    
    return ""