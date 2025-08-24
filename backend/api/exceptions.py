"""
Custom exception handling for consistent API responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error response format.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': None,
            'status_code': response.status_code
        }

        # Handle different types of errors
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Field-specific validation errors
                custom_response_data['message'] = 'Validation error'
                custom_response_data['details'] = exc.detail
            elif isinstance(exc.detail, list):
                # List of errors
                custom_response_data['message'] = exc.detail[0] if exc.detail else 'An error occurred'
                custom_response_data['details'] = exc.detail
            else:
                # Single error message
                custom_response_data['message'] = str(exc.detail)
        
        # Specific error handling
        if response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data['message'] = 'Resource not found'
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data['message'] = 'Permission denied'
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data['message'] = 'Authentication required'
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            custom_response_data['message'] = 'Rate limit exceeded. Please try again later.'
        elif response.status_code >= 500:
            custom_response_data['message'] = 'Internal server error'
            # Log server errors
            logger.error(f"Server error: {exc}", exc_info=True)
        
        response.data = custom_response_data

    return response


class RateLimitExceeded(Exception):
    """Custom exception for rate limiting"""
    def __init__(self, message="Rate limit exceeded"):
        self.message = message
        super().__init__(self.message)


class AnalyticsTrackingError(Exception):
    """Custom exception for analytics tracking errors"""
    def __init__(self, message="Analytics tracking failed"):
        self.message = message
        super().__init__(self.message)


def success_response(data=None, message="Success", status_code=200):
    """
    Standard success response format.
    """
    response_data = {
        'error': False,
        'message': message,
        'data': data,
        'status_code': status_code
    }
    return Response(response_data, status=status_code)


def error_response(message="An error occurred", details=None, status_code=400):
    """
    Standard error response format.
    """
    response_data = {
        'error': True,
        'message': message,
        'details': details,
        'status_code': status_code
    }
    return Response(response_data, status=status_code)