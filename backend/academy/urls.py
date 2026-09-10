from django.urls import path

from . import views

urlpatterns = [
    path("courses/", views.CourseListView.as_view(), name="course-list"),
    path("courses/create/", views.CourseCreateView.as_view(), name="course-create"),
    path("courses/<uuid:pk>/", views.CourseDetailView.as_view(), name="course-detail"),
    path("courses/<uuid:pk>/enroll/", views.EnrollView.as_view(), name="course-enroll"),
    path("courses/<uuid:pk>/content/", views.CourseContentView.as_view(), name="course-content"),
    path("courses/<uuid:pk>/chapters/<uuid:chapter_id>/complete/", views.CompleteChapterView.as_view(), name="chapter-complete"),
    path("chapters/create/", views.ChapterCreateView.as_view(), name="chapter-create"),
    path("pay/", views.PayOrderView.as_view(), name="pay-order"),
    path("mine/", views.MyCoursesView.as_view(), name="my-courses"),
    path("certificates/", views.MyCertificatesView.as_view(), name="my-certificates"),
    path("certificates/verify/", views.CertificateVerifyView.as_view(), name="certificate-verify"),
]