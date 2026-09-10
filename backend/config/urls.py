"""Root URL configuration."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from admin_api.views import PublicSettingsView

admin_api_public_settings = PublicSettingsView.as_view()
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("accounts.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/videos/", include("videos.urls")),
    path("api/academy/", include("academy.urls")),
    path("api/news/", include("news.urls")),
    path("api/health/", include("accounts.urls_health")),
    path("api/admin/", include("admin_api.urls")),
    path("api/public/settings/", admin_api_public_settings, name="public-settings"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)