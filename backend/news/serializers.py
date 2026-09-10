from rest_framework import serializers

from .models import NewsFeed


class NewsFeedSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = NewsFeed
        fields = [
            "id",
            "title_fa",
            "title_en",
            "summary_fa",
            "image_url",
            "category",
            "category_display",
            "source_url",
            "published_at",
            "created_at",
        ]


class NewsFeedWriteSerializer(serializers.ModelSerializer):
    """Manual article creation / editing (admin)."""

    class Meta:
        model = NewsFeed
        fields = ["source_url", "title_fa", "title_en", "summary_fa", "image_url", "category", "published_at", "is_published"]
        extra_kwargs = {"source_url": {"required": False, "allow_blank": True}}