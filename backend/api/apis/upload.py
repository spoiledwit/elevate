import cloudinary
import cloudinary.uploader
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
import os


@extend_schema(
    request={
        "multipart/form-data": {
            "schema": {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "File to upload (image, video, document, etc.)"
                    },
                    "resource_type": {
                        "type": "string",
                        "enum": ["image", "video", "raw", "auto"],
                        "default": "auto",
                        "description": "Type of resource: image, video, raw (for documents), or auto (automatic detection)"
                    },
                    "folder": {
                        "type": "string",
                        "description": "Optional folder path in Cloudinary"
                    }
                },
                "required": ["file"]
            }
        }
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "secure_url": {"type": "string", "description": "HTTPS URL of the uploaded file"},
                "public_id": {"type": "string", "description": "Cloudinary public ID"},
                "resource_type": {"type": "string", "description": "Type of uploaded resource"},
                "format": {"type": "string", "description": "File format"},
                "size": {"type": "integer", "description": "File size in bytes"},
                "width": {"type": "integer", "description": "Width (for images/videos)"},
                "height": {"type": "integer", "description": "Height (for images/videos)"}
            }
        },
        400: {"description": "Bad request - no file provided or invalid file"},
        413: {"description": "File too large"},
        500: {"description": "Server error during upload"}
    },
    description="Upload any file type to Cloudinary and get the secure URL"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_to_cloudinary(request):
    """
    Upload a file to Cloudinary and return the secure URL.
    Supports images, videos, and documents.
    """
    
    # Get the uploaded file
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get optional parameters
    resource_type = request.data.get('resource_type', 'auto')
    folder = request.data.get('folder', f'elevate/{request.user.username}')
    
    # File size validation (50MB limit for free Cloudinary plan)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
    if uploaded_file.size > MAX_FILE_SIZE:
        return Response(
            {'error': f'File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB'}, 
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        )
    
    try:
        # Determine file type based on extension if resource_type is auto
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        
        # Map extensions to Cloudinary resource types
        if resource_type == 'auto':
            if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico']:
                resource_type = 'image'
            elif file_extension in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm']:
                resource_type = 'video'
            else:
                # Everything else (PDFs, docs, zips, etc.) goes as 'raw'
                resource_type = 'raw'
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            uploaded_file,
            resource_type=resource_type,
            folder=folder,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            # Add some optimizations
            quality='auto',
            fetch_format='auto'
        )
        
        # Prepare response data
        response_data = {
            'secure_url': upload_result.get('secure_url'),
            'public_id': upload_result.get('public_id'),
            'resource_type': upload_result.get('resource_type'),
            'format': upload_result.get('format'),
            'size': upload_result.get('bytes'),
            'original_filename': uploaded_file.name,
        }
        
        # Add dimensions for images and videos
        if resource_type in ['image', 'video']:
            response_data['width'] = upload_result.get('width')
            response_data['height'] = upload_result.get('height')
        
        # Add duration for videos
        if resource_type == 'video':
            response_data['duration'] = upload_result.get('duration')
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Upload failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    request={
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                    "public_id": {
                        "type": "string",
                        "description": "Cloudinary public ID of the file to delete"
                    },
                    "resource_type": {
                        "type": "string",
                        "enum": ["image", "video", "raw"],
                        "default": "image",
                        "description": "Type of resource to delete"
                    }
                },
                "required": ["public_id"]
            }
        }
    },
    responses={
        200: {"description": "File deleted successfully"},
        400: {"description": "Bad request - no public_id provided"},
        500: {"description": "Server error during deletion"}
    },
    description="Delete a file from Cloudinary using its public ID"
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_from_cloudinary(request):
    """
    Delete a file from Cloudinary using its public ID.
    """
    
    public_id = request.data.get('public_id')
    if not public_id:
        return Response(
            {'error': 'No public_id provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    resource_type = request.data.get('resource_type', 'image')
    
    try:
        # Delete from Cloudinary
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type
        )
        
        if result.get('result') == 'ok':
            return Response(
                {'message': 'File deleted successfully'}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'File not found or already deleted'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Deletion failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )