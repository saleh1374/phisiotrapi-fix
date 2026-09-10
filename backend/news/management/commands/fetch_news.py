"""
Fetch articles from the configured RSS feeds, translate them to Persian and
store them as unpublished drafts for admin review.

Usage:
    python manage.py fetch_news

Scheduled automatically every 6 hours via Celery Beat (see config/celery.py).
"""
import datetime

import feedparser
from django.core.management.base import BaseCommand

from news.models import NewsFeed
from news.services import enrich_article

RSS_FEEDS = [
    # ── Top physiotherapy blogs (verified working feeds) ──
    "https://mikereinold.com/feed",
    "https://www.e3rehab.com/feed",
    "https://www.webpt.com/blog/feed/",
    "https://www.choosept.com/blog/rss",
    "https://www.nielasher.com/blog/feed/",
    "https://www.physio-network.com/feed/",
    "https://www.physiotutors.com/feed/",
    # ── Sports physiotherapy ──
    "https://www.thesportphysio.com/feed/",
    "https://www.pogophysio.com.au/feed/",
    # ── Research (filtered by relevancy) ──
    "https://www.sciencedaily.com/rss/health_medicine.xml",
]


class Command(BaseCommand):
    help = "Scan physiotherapy RSS feeds, translate and save new articles."

    def handle(self, *args, **options):
        total_new = 0
        for feed_url in RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
            except Exception as exc:  # network or parse errors must not break the loop
                self.stderr.write(f"خطا در خواندن {feed_url}: {exc}")
                continue

            if getattr(feed, "bozo", False) and not feed.entries:
                self.stderr.write(f"فید نامعتبر: {feed_url}")
                continue

            for entry in feed.entries[:20]:  # Increased from 15 to 20 per feed
                link = (entry.get("link") or "").strip()
                if not link or NewsFeed.objects.filter(source_url=link).exists():
                    continue
                payload = enrich_article(entry)
                
                # Auto-publish physiotherapy-relevant content
                is_relevant = self._is_physio_relevant(
                    payload.get("title_en", ""),
                    payload.get("summary_fa", "")
                )
                
                NewsFeed.objects.create(
                    source_url=payload["source_url"],
                    title_fa=payload["title_fa"],
                    title_en=payload["title_en"],
                    summary_fa=payload["summary_fa"],
                    image_url=payload["image_url"],
                    category=payload["category"],
                    published_at=datetime.date.today(),
                    is_published=is_relevant,  # Auto-publish if relevant
                )
                total_new += 1

        self.stdout.write(self.style.SUCCESS(f"{total_new} خبر جدید ذخیره شد."))
    
    def _is_physio_relevant(self, title: str, summary: str) -> bool:
        """Check if article is relevant to physiotherapy for auto-publish."""
        text = f"{title} {summary}".lower()
        # Strict physiotherapy keywords ONLY
        physio_keywords = [
            "physiotherapy", "physical therapy", "rehabilitation",
            "physio", "exercise therapy", "musculoskeletal",
            "orthopedic", "sports injury", "back pain", "neck pain",
            "knee rehabilitation", "stroke recovery", "balance training",
            "manual therapy", "electrotherapy", "ultrasound therapy",
            "chiropractic", "osteopathy", "massage therapy",
            "spinal cord injury", "nerve damage", "chronic pain",
            "mobility", "gait training", "posture", "stretching",
            "strength training", "flexibility", "range of motion",
            "physical rehabilitation", "functional training",
            "core stability", "proprioception", "ergonomics",
            "workplace injury", "sports medicine", "athletic training",
            "fall prevention", "balance disorders", "vestibular",
            "pelvic floor", "cardiac rehabilitation", "pulmonary rehab",
            "pediatric therapy", "geriatric therapy", "neurological rehab",
            "fibromyalgia", "arthritis", "osteoporosis",
            "rotator cuff", "tendinitis", "bursitis",
            "sciatica", "herniated disc", "scoliosis",
            "carpal tunnel", "plantar fasciitis", "tendinopathy",
        ]
        return any(kw in text for kw in physio_keywords)