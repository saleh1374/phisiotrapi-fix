from rest_framework.test import APITestCase as TestCase
from django.urls import reverse

from .models import NewsFeed
from .services import categorize, translate_text


class NewsTests(TestCase):
    def setUp(self):
        self.published = NewsFeed.objects.create(
            source_url="https://example.com/1",
            title_fa="خبر منتشر شده",
            title_en="Published article",
            summary_fa="چکیده خبر",
            category=NewsFeed.Category.CLINICAL,
            is_published=True,
        )
        NewsFeed.objects.create(
            source_url="https://example.com/2",
            title_fa="خبر در انتظار تایید",
            title_en="Draft article",
            summary_fa="چکیده",
            category=NewsFeed.Category.TECH,
            is_published=False,
        )

    def test_only_published_listed(self):
        resp = self.client.get(reverse("news-list"))
        self.assertEqual(len(resp.json()), 1)
        self.assertEqual(resp.json()[0]["title_fa"], "خبر منتشر شده")

    def test_detail_of_draft_hidden(self):
        resp = self.client.get(reverse("news-detail", args=[NewsFeed.objects.get(is_published=False).id]))
        self.assertEqual(resp.status_code, 404)

    def test_category_filter(self):
        resp = self.client.get(reverse("news-list") + "?category=" + NewsFeed.Category.CLINICAL)
        self.assertEqual(len(resp.json()), 1)

    def test_categorize_by_keywords(self):
        self.assertEqual(categorize("a new wearable technology device"), NewsFeed.Category.TECH)
        self.assertEqual(categorize("international conference on physiotherapy"), NewsFeed.Category.CONFERENCE)
        self.assertEqual(categorize("random clinical study text"), NewsFeed.Category.CLINICAL)

    def test_dictionary_translation(self):
        out = translate_text("New study shows exercise reduces chronic back pain in patients")
        self.assertIn("مزمن", out)
        self.assertIn("بیماران", out)