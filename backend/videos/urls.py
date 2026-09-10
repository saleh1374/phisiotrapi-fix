from django.urls import path

from . import views

urlpatterns = [
    path("", views.VideoListView.as_view(), name="video-list"),
    path("create/", views.VideoCreateView.as_view(), name="video-create"),
    path("mine/", views.MyVideosView.as_view(), name="my-videos"),
    path("mine/<uuid:pk>/complete/", views.CompleteVideoView.as_view(), name="complete-video"),
    path("prescribe/", views.PrescribeVideosView.as_view(), name="prescribe-videos"),
    path("my-patients/", views.MyPatientsView.as_view(), name="my-patients"),
    path("<uuid:pk>/", views.VideoDetailView.as_view(), name="video-detail"),
]