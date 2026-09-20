from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to always return a consistent
    JSON envelope: { "error": "<message>", "detail": <original> }
    """
    response = exception_handler(exc, context)

    if response is not None:
        original_data = response.data
        message = str(exc)
        response.data = {
            "error": message,
            "detail": original_data,
        }

    return response
