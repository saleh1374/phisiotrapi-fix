"""Custom DRF exception handler for consistent error responses."""
import logging

from rest_framework import status
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Wrap DRF's default handler to produce uniform JSON error payloads.

    Every error response has the shape:
        {"detail": "...", "errors": {...}}  (errors only on validation errors)
    """
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(response.data, dict) and "detail" not in response.data:
            # Validation errors (serializer errors) → flatten under "errors"
            response.data = {"detail": "خطای اعتبارسنجی", "errors": response.data}
        elif isinstance(response.data, dict):
            response.data = {"detail": response.data.get("detail", str(response.data))}

    if response is None:
        # Unhandled exception → log and return 500
        logger.exception("Unhandled exception in %s", context.get("view", "unknown"))
        from rest_framework.response import Response

        response = Response(
            {"detail": "خطای داخلی سرور. لطفاً بعداً تلاش کنید."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
