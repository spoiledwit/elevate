"""
OpenAI Realtime API integration for Milo chatbot
"""
import json
import requests
from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_realtime_session(request):
    """
    Generate an ephemeral token for OpenAI Realtime API
    """
    try:
        # Session configuration for OpenAI Realtime API
        session_config = {
            "session": {
                "type": "realtime",
                "model": "gpt-realtime",
                "instructions": "You are Milo, a helpful AI assistant for social media content creation. Be concise, creative, and friendly. Help users create engaging posts, captions, and content ideas.",
            }
        }

        # Generate ephemeral token
        openai_response = requests.post(
            'https://api.openai.com/v1/realtime/client_secrets',
            headers={
                'Authorization': f'Bearer {settings.OPENAI_API_KEY}',
                'Content-Type': 'application/json',
            },
            json=session_config,
            timeout=30
        )

        if openai_response.status_code == 200:
            data = openai_response.json()
            return Response({
                'value': data.get('value'),
                'expires_at': data.get('expires_at')
            })
        else:
            return Response({
                'error': f'OpenAI API error: {openai_response.status_code}',
                'details': openai_response.text
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.exceptions.Timeout:
        return Response({
            'error': 'Request to OpenAI API timed out'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)

    except requests.exceptions.RequestException as e:
        return Response({
            'error': f'Network error: {str(e)}'
        }, status=status.HTTP_502_BAD_GATEWAY)

    except Exception as e:
        return Response({
            'error': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def realtime_status(request):
    """
    Check if realtime API is available and configured
    """
    try:
        # Check if OpenAI API key is configured
        api_key_configured = bool(getattr(settings, 'OPENAI_API_KEY', None))

        # Log API key status for debugging (without exposing the key)
        if api_key_configured:
            print("OpenAI API key is configured")
        else:
            print("OpenAI API key is NOT configured")

        return Response({
            'available': api_key_configured,
            'model': 'gpt-realtime',
            'voice': 'marin'
        })

    except Exception as e:
        return Response({
            'error': f'Status check failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)