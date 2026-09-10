from django.urls import path

from . import views

urlpatterns = [
    path("doctors/", views.DoctorListView.as_view(), name="doctor-list"),
    path("doctors/<uuid:doctor_id>/", views.DoctorDetailView.as_view(), name="doctor-detail"),
    path("doctors/<uuid:doctor_id>/available-days/", views.AvailableDaysView.as_view(), name="available-days"),
    path("doctors/<uuid:doctor_id>/slots/", views.SlotsView.as_view(), name="slots"),
    path("book/", views.BookAppointmentView.as_view(), name="book-appointment"),
    path("mine/", views.MyAppointmentsView.as_view(), name="my-appointments"),
    path("<uuid:pk>/cancel/", views.CancelAppointmentView.as_view(), name="cancel-appointment"),
    path("doctor/", views.DoctorAppointmentsView.as_view(), name="doctor-appointments"),
    path("doctor/<uuid:pk>/status/", views.UpdateAppointmentStatusView.as_view(), name="doctor-appointment-status"),
]