import uuid

from django.db import models


class NewsFeed(models.Model):
    class Category(models.TextChoices):
        TECH = "تکنولوژی روز", "تکنولوژی روز"
        CLINICAL = "تحقیقات بالینی", "تحقیقات بالینی"
        CONFERENCE = "همایش‌ها", "همایش‌ها"
        METHODS = "متدهای نوین", "متدهای نوین"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_url = models.URLField("لینک اصلی", max_length=500, unique=True)
    title_fa = models.CharField("عنوان فارسی", max_length=500)
    title_en = models.CharField("عنوان اصلی", max_length=500, blank=True)
    summary_fa = models.TextField("چکیده فارسی", blank=True)
    image_url = models.URLField("تصویر", max_length=500, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.CLINICAL)
    published_at = models.DateField(null=True, blank=True)
    is_published = models.BooleanField("منتشر شده", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "خبر"
        verbose_name_plural = "اخبار"
        ordering = ["-published_at", "-created_at"]
        indexes = [models.Index(fields=["category", "is_published"])]

    def __str__(self):
        return self.title_fa