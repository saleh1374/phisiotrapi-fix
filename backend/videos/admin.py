from django.contrib import admin

from .models import PatientPrescription, Video


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ["title", "body_part", "injury_type", "is_public", "view_count", "duration_minutes", "created_at"]
    list_filter = ["body_part", "injury_type", "is_public"]
    search_fields = ["title", "description"]
    list_editable = ["is_public"]


@admin.register(PatientPrescription)
class PatientPrescriptionAdmin(admin.ModelAdmin):
    list_display = ["patient", "video", "doctor", "assigned_date", "due_date", "is_done"]
    list_filter = ["is_done", "due_date"]
    search_fields = ["patient__full_name", "patient__phone_number", "video__title"]