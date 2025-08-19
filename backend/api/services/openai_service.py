import base64
import io
import logging
from typing import Dict, Any, Optional, Iterator, Union, List
from django.conf import settings
from openai import OpenAI
from openai.types.chat import ChatCompletion, ChatCompletionChunk
from django.http import StreamingHttpResponse
import json

logger = logging.getLogger(__name__)


class OpenAIService:
    """
    Service class for OpenAI API interactions including text generation,
    image generation, streaming responses, and vision capabilities.
    """
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured in settings")
        
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.default_text_model = "gpt-4"
        self.default_image_model = "dall-e-3"
    
    def generate_text(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate text using OpenAI's chat completion API.
        
        Args:
            prompt: The user prompt/question
            model: Model to use (defaults to gpt-4)
            max_tokens: Maximum tokens to generate
            temperature: Creativity level (0-2)
            system_message: System instructions for the model
            **kwargs: Additional parameters for the API
            
        Returns:
            Dictionary containing the generated text and metadata
        """
        try:
            messages = []
            
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })
            
            messages.append({
                "role": "user", 
                "content": prompt
            })
            
            completion_kwargs = {
                "model": model or self.default_text_model,
                "messages": messages,
                "temperature": temperature,
                **kwargs
            }
            
            if max_tokens:
                completion_kwargs["max_tokens"] = max_tokens
            
            response = self.client.chat.completions.create(**completion_kwargs)
            
            return {
                "success": True,
                "text": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_streaming_text(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Iterator[Dict[str, Any]]:
        """
        Generate streaming text using OpenAI's chat completion API.
        
        Args:
            prompt: The user prompt/question
            model: Model to use (defaults to gpt-4)
            max_tokens: Maximum tokens to generate
            temperature: Creativity level (0-2)
            system_message: System instructions for the model
            **kwargs: Additional parameters for the API
            
        Yields:
            Dictionary containing streaming text chunks and metadata
        """
        try:
            messages = []
            
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })
            
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            completion_kwargs = {
                "model": model or self.default_text_model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
                **kwargs
            }
            
            if max_tokens:
                completion_kwargs["max_tokens"] = max_tokens
            
            stream = self.client.chat.completions.create(**completion_kwargs)
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield {
                        "success": True,
                        "content": chunk.choices[0].delta.content,
                        "model": chunk.model,
                        "finish_reason": chunk.choices[0].finish_reason
                    }
                    
        except Exception as e:
            logger.error(f"Error generating streaming text: {str(e)}")
            yield {
                "success": False,
                "error": str(e)
            }
    
    def generate_image(
        self,
        prompt: str,
        model: Optional[str] = None,
        size: str = "1024x1024",
        quality: str = "standard",
        n: int = 1,
        style: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate images using OpenAI's DALL-E API.
        
        Args:
            prompt: Description of the image to generate
            model: Model to use (dall-e-2, dall-e-3)
            size: Image size (256x256, 512x512, 1024x1024, 1792x1024, 1024x1792)
            quality: Image quality (standard, hd) - only for dall-e-3
            n: Number of images to generate (1-10)
            style: Image style (vivid, natural) - only for dall-e-3
            **kwargs: Additional parameters for the API
            
        Returns:
            Dictionary containing the generated image data and metadata
        """
        try:
            generation_kwargs = {
                "model": model or self.default_image_model,
                "prompt": prompt,
                "size": size,
                "n": n,
                "response_format": "b64_json",  # Return as base64
                **kwargs
            }
            
            # Add model-specific parameters
            if model == "dall-e-3" or (not model and self.default_image_model == "dall-e-3"):
                generation_kwargs["quality"] = quality
                if style:
                    generation_kwargs["style"] = style
            
            response = self.client.images.generate(**generation_kwargs)
            
            images = []
            for image_data in response.data:
                images.append({
                    "b64_json": image_data.b64_json,
                    "revised_prompt": getattr(image_data, 'revised_prompt', None)
                })
            
            return {
                "success": True,
                "images": images,
                "model": model or self.default_image_model,
                "prompt": prompt
            }
            
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_image(
        self,
        image_data: Union[str, bytes],
        prompt: str = "What's in this image?",
        model: str = "gpt-4-vision-preview",
        max_tokens: Optional[int] = None,
        detail: str = "auto",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Analyze images using OpenAI's vision capabilities.
        
        Args:
            image_data: Base64 encoded image data or bytes
            prompt: Question about the image
            model: Vision model to use
            max_tokens: Maximum tokens to generate
            detail: Level of detail (low, high, auto)
            **kwargs: Additional parameters for the API
            
        Returns:
            Dictionary containing the image analysis results
        """
        try:
            # Convert bytes to base64 if needed
            if isinstance(image_data, bytes):
                image_data = base64.b64encode(image_data).decode('utf-8')
            
            # Ensure data URL format
            if not image_data.startswith('data:image'):
                image_data = f"data:image/jpeg;base64,{image_data}"
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data,
                                "detail": detail
                            }
                        }
                    ]
                }
            ]
            
            completion_kwargs = {
                "model": model,
                "messages": messages,
                **kwargs
            }
            
            if max_tokens:
                completion_kwargs["max_tokens"] = max_tokens
            
            response = self.client.chat.completions.create(**completion_kwargs)
            
            return {
                "success": True,
                "analysis": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_social_media_content(
        self,
        platform: str,
        topic: str,
        tone: str = "professional",
        max_length: Optional[int] = None,
        include_hashtags: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate platform-specific social media content.
        
        Args:
            platform: Social media platform (twitter, facebook, instagram, linkedin, etc.)
            topic: Content topic or theme
            tone: Writing tone (professional, casual, funny, inspirational, etc.)
            max_length: Maximum character length for the content
            include_hashtags: Whether to include relevant hashtags
            **kwargs: Additional parameters
            
        Returns:
            Dictionary containing the generated content
        """
        platform_guidelines = {
            "twitter": "280 characters max, engaging and concise",
            "facebook": "engaging and conversational, can be longer form",
            "instagram": "visual-focused with engaging caption",
            "linkedin": "professional tone, thought leadership content",
            "tiktok": "fun, trendy, and engaging for young audience",
            "youtube": "compelling and descriptive for video content"
        }
        
        guideline = platform_guidelines.get(platform.lower(), "engaging social media content")
        
        system_message = f"""You are a social media content creator specialist. 
        Create {tone} content for {platform} about {topic}.
        
        Platform guidelines: {guideline}
        {'Include relevant hashtags at the end.' if include_hashtags else 'Do not include hashtags.'}
        {f'Keep content under {max_length} characters.' if max_length else ''}
        
        Make the content engaging, relevant, and platform-appropriate."""
        
        prompt = f"Create a {tone} {platform} post about {topic}."
        
        return self.generate_text(
            prompt=prompt,
            system_message=system_message,
            temperature=0.8,  # More creative for social content
            **kwargs
        )
    
    def improve_content(
        self,
        content: str,
        improvement_type: str = "grammar",
        target_audience: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Improve existing content using AI.
        
        Args:
            content: Original content to improve
            improvement_type: Type of improvement (grammar, clarity, engagement, tone, etc.)
            target_audience: Target audience for the content
            **kwargs: Additional parameters
            
        Returns:
            Dictionary containing the improved content
        """
        improvement_prompts = {
            "grammar": "Fix grammar, spelling, and punctuation errors while maintaining the original meaning and tone.",
            "clarity": "Improve clarity and readability while keeping the same message and tone.",
            "engagement": "Make this content more engaging and compelling while preserving the core message.",
            "tone": "Adjust the tone to be more professional while keeping the same information.",
            "concise": "Make this content more concise while preserving all important information."
        }
        
        base_prompt = improvement_prompts.get(improvement_type, "Improve this content")
        
        system_message = f"""You are a professional content editor. {base_prompt}
        {f'The target audience is: {target_audience}' if target_audience else ''}
        
        Return only the improved content without any explanations or comments."""
        
        prompt = f"Improve this content:\n\n{content}"
        
        return self.generate_text(
            prompt=prompt,
            system_message=system_message,
            temperature=0.3,  # Less creative for improvements
            **kwargs
        )


# Utility functions for Django views
def format_streaming_response(generator: Iterator[Dict[str, Any]]) -> StreamingHttpResponse:
    """
    Format OpenAI streaming response for Django StreamingHttpResponse.
    """
    def event_stream():
        for chunk in generator:
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return response


def save_image_from_base64(b64_data: str, filename: str) -> str:
    """
    Save base64 image data to Django media directory.
    
    Args:
        b64_data: Base64 encoded image data
        filename: Desired filename
        
    Returns:
        Path to saved file relative to MEDIA_ROOT
    """
    import os
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage
    
    # Decode base64 data
    image_data = base64.b64decode(b64_data)
    
    # Create ContentFile
    image_file = ContentFile(image_data, name=filename)
    
    # Save to media directory
    file_path = default_storage.save(f"ai_generated/{filename}", image_file)
    
    return file_path