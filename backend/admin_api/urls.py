from django.urls import path

from . import views

urlpatterns = [
    path("stats/", views.AdminStatsView.as_view(), name="admin-stats"),
    path("users/", views.AdminUsersView.as_view(), name="admin-users"),
    path("users/<uuid:pk>/", views.AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("appointments/", views.AdminAppointmentsView.as_view(), name="admin-appointments"),
    path("appointments/<uuid:pk>/status/", views.AdminAppointmentActionView.as_view(), name="admin-appointment-action"),
    path("videos/", views.AdminVideosView.as_view(), name="admin-videos"),
    path("videos/<uuid:pk>/", views.AdminVideoDetailView.as_view(), name="admin-video-detail"),
    path("courses/", views.AdminCoursesView.as_view(), name="admin-courses"),
    path("courses/<uuid:pk>/", views.AdminCourseDetailView.as_view(), name="admin-course-detail"),
    path("courses/<uuid:course_id>/chapters/", views.AdminChaptersView.as_view(), name="admin-chapters"),
    path("chapters/<uuid:pk>/", views.AdminChapterDetailView.as_view(), name="admin-chapter-detail"),
    path("news/", views.AdminNewsView.as_view(), name="admin-news"),
    path("news/<uuid:pk>/", views.AdminNewsDetailView.as_view(), name="admin-news-detail"),
    path("orders/", views.AdminOrdersView.as_view(), name="admin-orders"),
    path("settings/", views.AdminSettingsView.as_view(), name="admin-settings"),
]