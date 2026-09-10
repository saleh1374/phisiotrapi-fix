from django.contrib import admin

from .models import NewsFeed


@admin.register(NewsFeed)
class NewsFeedAdmin(admin.ModelAdmin):
    list_display = ["title_fa", "category", "published_at", "is_published", "created_at"]
    list_filter = ["category", "is_published", "published_at"]
    search_fields = ["title_fa", "title_en", "summary_fa"]
    list_editable = ["is_published", "category"]
    actions = ["publish_selected", "unpublish_selected"]

    @admin.action(description="انتشار اخبار انتخاب‌شده")
    def publish_selected(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="خارج کردن از حالت انتشار")
    def unpublish_selected(self, request, queryset):
        queryset.update(is_published=False)