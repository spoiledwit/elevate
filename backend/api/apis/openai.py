import json
import logging
import base64
from typing import Dict, Any
from django.http import StreamingHttpResponse, JsonResponse
from django.core.files.storage import default_storage
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser

from ..services.openai_service import OpenAIService, format_streaming_response, save_image_from_base64

logger = logging.getLogger(__name__)


class OpenAIViewSet(viewsets.GenericViewSet):
    """
    ViewSet for OpenAI API endpoints including text generation, 
    image generation, streaming, and vision capabilities.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.openai_service = OpenAIService()
    
    @extend_schema(
        operation_id="generate_text",
        summary="Generate text using OpenAI",
        description="Generate text content using OpenAI's language models",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The text prompt"},
                    "model": {"type": "string", "description": "Model to use (optional)", "default": "gpt-4"},
                    "max_tokens": {"type": "integer", "description": "Maximum tokens to generate"},
                    "temperature": {"type": "number", "description": "Creativity level (0-2)", "default": 0.7},
                    "system_message": {"type": "string", "description": "System instructions (optional)"}
                },
                "required": ["prompt"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "text": {"type": "string"},
                    "model": {"type": "string"},
                    "usage": {
                        "type": "object",
                        "properties": {
                            "prompt_tokens": {"type": "integer"},
                            "completion_tokens": {"type": "integer"},
                            "total_tokens": {"type": "integer"}
                        }
                    }
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
            500: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="generate-text")
    def generate_text(self, request):
        """Generate text using OpenAI's language models."""
        try:
            data = request.data
            
            # Validate required fields
            if 'prompt' not in data:
                return Response(
                    {"error": "Prompt is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Call OpenAI service
            result = self.openai_service.generate_text(
                prompt=data['prompt'],
                model=data.get('model'),
                max_tokens=data.get('max_tokens'),
                temperature=data.get('temperature', 0.7),
                system_message=data.get('system_message')
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": result['error']}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in generate_text: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        operation_id="generate_streaming_text",
        summary="Generate streaming text using OpenAI",
        description="Generate text content with streaming response using OpenAI's language models",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The text prompt"},
                    "model": {"type": "string", "description": "Model to use (optional)", "default": "gpt-4"},
                    "max_tokens": {"type": "integer", "description": "Maximum tokens to generate"},
                    "temperature": {"type": "number", "description": "Creativity level (0-2)", "default": 0.7},
                    "system_message": {"type": "string", "description": "System instructions (optional)"}
                },
                "required": ["prompt"]
            }
        },
        responses={
            200: {
                "type": "string",
                "description": "Server-sent events stream"
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="generate-text-stream")
    def generate_streaming_text(self, request):
        """Generate text with streaming response using OpenAI's language models."""
        try:
            data = request.data
            
            # Validate required fields
            if 'prompt' not in data:
                return Response(
                    {"error": "Prompt is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate streaming response
            generator = self.openai_service.generate_streaming_text(
                prompt=data['prompt'],
                model=data.get('model'),
                max_tokens=data.get('max_tokens'),
                temperature=data.get('temperature', 0.7),
                system_message=data.get('system_message')
            )
            
            return format_streaming_response(generator)
                
        except Exception as e:
            logger.error(f"Error in generate_streaming_text: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        operation_id="generate_image",
        summary="Generate images using OpenAI DALL-E",
        description="Generate images from text prompts using OpenAI's DALL-E models",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the image to generate"},
                    "model": {"type": "string", "description": "Model to use (dall-e-2, dall-e-3)", "default": "dall-e-3"},
                    "size": {"type": "string", "description": "Image size", "default": "1024x1024"},
                    "quality": {"type": "string", "description": "Image quality (standard, hd)", "default": "standard"},
                    "n": {"type": "integer", "description": "Number of images to generate", "default": 1},
                    "style": {"type": "string", "description": "Image style (vivid, natural)"},
                    "save_to_media": {"type": "boolean", "description": "Save images to media directory", "default": False}
                },
                "required": ["prompt"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "images": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "b64_json": {"type": "string"},
                                "revised_prompt": {"type": "string"},
                                "url": {"type": "string", "description": "URL if saved to media"}
                            }
                        }
                    },
                    "model": {"type": "string"},
                    "prompt": {"type": "string"}
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
            500: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="generate-image")
    def generate_image(self, request):
        """Generate images using OpenAI's DALL-E models."""
        try:
            data = request.data
            
            # Validate required fields
            if 'prompt' not in data:
                return Response(
                    {"error": "Prompt is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Call OpenAI service
            result = self.openai_service.generate_image(
                prompt=data['prompt'],
                model=data.get('model'),
                size=data.get('size', '1024x1024'),
                quality=data.get('quality', 'standard'),
                n=data.get('n', 1),
                style=data.get('style')
            )
            
            if result['success']:
                # Optionally save images to media directory
                if data.get('save_to_media', False):
                    for i, image in enumerate(result['images']):
                        filename = f"dalle_image_{request.user.id}_{i}_{hash(data['prompt'])}.png"
                        try:
                            file_path = save_image_from_base64(image['b64_json'], filename)
                            image['url'] = default_storage.url(file_path)
                        except Exception as save_error:
                            logger.error(f"Error saving image: {str(save_error)}")
                
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": result['error']}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in generate_image: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        operation_id="analyze_image",
        summary="Analyze images using OpenAI Vision",
        description="Analyze images and answer questions about them using OpenAI's vision models",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "image": {"type": "string", "format": "binary", "description": "Image file to analyze"},
                    "prompt": {"type": "string", "description": "Question about the image", "default": "What's in this image?"},
                    "model": {"type": "string", "description": "Vision model to use", "default": "gpt-4-vision-preview"},
                    "max_tokens": {"type": "integer", "description": "Maximum tokens to generate"},
                    "detail": {"type": "string", "description": "Level of detail (low, high, auto)", "default": "auto"}
                },
                "required": ["image"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "analysis": {"type": "string"},
                    "model": {"type": "string"},
                    "usage": {
                        "type": "object",
                        "properties": {
                            "prompt_tokens": {"type": "integer"},
                            "completion_tokens": {"type": "integer"},
                            "total_tokens": {"type": "integer"}
                        }
                    }
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
            500: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="analyze-image")
    def analyze_image(self, request):
        """Analyze images using OpenAI's vision capabilities."""
        try:
            # Handle both multipart and JSON requests
            if request.content_type.startswith('multipart/form-data'):
                # File upload
                if 'image' not in request.FILES:
                    return Response(
                        {"error": "Image file is required"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image_file = request.FILES['image']
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
                prompt = request.data.get('prompt', "What's in this image?")
                model = request.data.get('model', 'gpt-4-vision-preview')
                max_tokens = request.data.get('max_tokens')
                detail = request.data.get('detail', 'auto')
            else:
                # JSON with base64 image data
                data = request.data
                if 'image_data' not in data:
                    return Response(
                        {"error": "image_data is required"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image_data = data['image_data']
                prompt = data.get('prompt', "What's in this image?")
                model = data.get('model', 'gpt-4-vision-preview')
                max_tokens = data.get('max_tokens')
                detail = data.get('detail', 'auto')
            
            # Call OpenAI service
            result = self.openai_service.analyze_image(
                image_data=image_data,
                prompt=prompt,
                model=model,
                max_tokens=max_tokens,
                detail=detail
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": result['error']}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in analyze_image: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        operation_id="generate_social_content",
        summary="Generate social media content",
        description="Generate platform-specific social media content using AI",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "platform": {"type": "string", "description": "Social media platform"},
                    "topic": {"type": "string", "description": "Content topic or theme"},
                    "tone": {"type": "string", "description": "Writing tone", "default": "professional"},
                    "max_length": {"type": "integer", "description": "Maximum character length"},
                    "include_hashtags": {"type": "boolean", "description": "Include hashtags", "default": True}
                },
                "required": ["platform", "topic"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "text": {"type": "string"},
                    "model": {"type": "string"},
                    "usage": {"type": "object"}
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
            500: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="generate-social-content")
    def generate_social_content(self, request):
        """Generate platform-specific social media content."""
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['platform', 'topic']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {"error": f"{field} is required"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Call OpenAI service
            result = self.openai_service.generate_social_media_content(
                platform=data['platform'],
                topic=data['topic'],
                tone=data.get('tone', 'professional'),
                max_length=data.get('max_length'),
                include_hashtags=data.get('include_hashtags', True)
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": result['error']}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in generate_social_content: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        operation_id="improve_content",
        summary="Improve existing content",
        description="Improve existing content using AI for grammar, clarity, engagement, etc.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "content": {"type": "string", "description": "Original content to improve"},
                    "improvement_type": {"type": "string", "description": "Type of improvement", "default": "grammar"},
                    "target_audience": {"type": "string", "description": "Target audience for the content"}
                },
                "required": ["content"]
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean"},
                    "text": {"type": "string"},
                    "model": {"type": "string"},
                    "usage": {"type": "object"}
                }
            },
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
            500: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    @action(["post"], detail=False, url_path="improve-content")
    def improve_content(self, request):
        """Improve existing content using AI."""
        try:
            data = request.data
            
            # Validate required fields
            if 'content' not in data:
                return Response(
                    {"error": "Content is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Call OpenAI service
            result = self.openai_service.improve_content(
                content=data['content'],
                improvement_type=data.get('improvement_type', 'grammar'),
                target_audience=data.get('target_audience')
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": result['error']}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in improve_content: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )