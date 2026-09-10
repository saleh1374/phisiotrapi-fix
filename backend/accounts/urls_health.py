from django.db import connection
from django.urls import path
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_ok = False
        return Response({"status": "ok" if db_ok else "db_error", "database": db_ok})


urlpatterns = [path("", HealthView.as_view(), name="health")]