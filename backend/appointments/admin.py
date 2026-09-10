from django.contrib import admin

from .models import Appointment, DoctorSchedule, Holiday


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ["doctor", "day_of_week", "start_work", "end_work", "break_start", "break_end", "session_duration"]
    list_filter = ["day_of_week", "session_duration"]
    search_fields = ["doctor__full_name", "doctor__phone_number"]
    list_editable = ["start_work", "end_work", "session_duration"]


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ["date", "doctor", "reason"]
    list_filter = ["doctor"]
    search_fields = ["reason", "doctor__full_name"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["appointment_date", "start_time", "doctor", "patient", "service_type", "status"]
    list_filter = ["status", "service_type", "appointment_date"]
    search_fields = ["doctor__full_name", "patient__full_name", "patient__phone_number"]
    date_hierarchy = "appointment_date"