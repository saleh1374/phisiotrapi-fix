from django.urls import path

from . import views

urlpatterns = [
    path("", views.NewsListView.as_view(), name="news-list"),
    path("create/", views.NewsCreateView.as_view(), name="news-create"),
    path("moderation/", views.NewsModerationListView.as_view(), name="news-moderation-list"),
    path("moderation/<uuid:pk>/", views.NewsModerationView.as_view(), name="news-moderation"),
    path("<uuid:pk>/", views.NewsDetailView.as_view(), name="news-detail"),
]