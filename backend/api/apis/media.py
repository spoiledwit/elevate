from django.db import transaction
from django.db.models import Sum
from django.http import Http404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from drf_spectacular.utils import extend_schema

from ..models import Media, Folder
from ..serializers import (
    MediaSerializer, 
    MediaUploadSerializer, 
    FolderSerializer, 
    BulkDeleteSerializer
)


@extend_schema(
    responses={
        200: FolderSerializer(many=True),
        400: {"description": "Bad request"},
    },
    description="List all folders for the authenticated user",
    methods=['GET']
)
@extend_schema(
    request=FolderSerializer,
    responses={
        201: FolderSerializer,
        400: {"description": "Bad request - validation errors"},
    },
    description="Create a new folder",
    methods=['POST']
)
class FolderListCreateAPIView(ListCreateAPIView):
    """
    List all folders for the authenticated user or create a new folder
    """
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user)


@extend_schema(
    responses={
        200: FolderSerializer,
        404: {"description": "Folder not found"},
    },
    description="Retrieve a folder",
    methods=['GET']
)
@extend_schema(
    request=FolderSerializer,
    responses={
        200: FolderSerializer,
        400: {"description": "Bad request - validation errors"},
        404: {"description": "Folder not found"},
    },
    description="Update a folder",
    methods=['PUT', 'PATCH']
)
@extend_schema(
    responses={
        204: {"description": "Folder deleted successfully"},
        400: {"description": "Cannot delete default folder"},
        404: {"description": "Folder not found"},
    },
    description="Delete a folder (moves media to default folder)",
    methods=['DELETE']
)
class FolderDetailAPIView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a folder
    """
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        """
        Delete folder - move media to default folder
        """
        folder = self.get_object()
        
        # Prevent deletion of default folder
        if folder.is_default:
            return Response(
                {'error': 'Cannot delete default folder'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Move all media to default folder
        default_folder = Folder.get_or_create_default(request.user)
        Media.objects.filter(folder=folder).update(folder=default_folder)
        
        # Delete the folder
        folder.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class MediaListCreateAPIView(APIView):
    """
    List all media for the authenticated user or create new media
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @extend_schema(
        responses={
            200: MediaSerializer(many=True),
            400: {"description": "Bad request"},
        },
        description="List all media files for the authenticated user with optional folder filtering",
        parameters=[
            {
                'name': 'folder_id',
                'in': 'query',
                'description': 'Filter by folder ID',
                'required': False,
                'type': 'integer'
            }
        ]
    )
    def get(self, request):
        """List media files with optional folder filtering"""
        folder_id = request.query_params.get('folder_id')
        
        queryset = Media.objects.filter(user=request.user)
        
        if folder_id:
            try:
                folder = Folder.objects.get(id=folder_id, user=request.user)
                queryset = queryset.filter(folder=folder)
            except Folder.DoesNotExist:
                return Response(
                    {'error': 'Invalid folder ID'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        serializer = MediaSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @extend_schema(
        request={
            "multipart/form-data": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "image": {
                            "type": "string",
                            "format": "binary",
                            "description": "Image file to upload"
                        },
                        "folder_id": {
                            "type": "integer",
                            "nullable": True,
                            "description": "Optional folder ID to organize the media"
                        },
                        "file_name": {
                            "type": "string",
                            "description": "Optional custom file name"
                        }
                    },
                    "required": ["image"]
                }
            }
        },
        responses={
            201: MediaSerializer,
            400: {"description": "Bad request - validation errors"},
        },
        description="Upload a new media file to Cloudinary"
    )
    def post(self, request):
        """Upload new media file"""
        serializer = MediaUploadSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            media = serializer.save()
            response_serializer = MediaSerializer(media, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    responses={
        200: MediaSerializer,
        404: {"description": "Media not found"},
    },
    description="Retrieve a media file",
    methods=['GET']
)
@extend_schema(
    request=MediaSerializer,
    responses={
        200: MediaSerializer,
        400: {"description": "Bad request - validation errors"},
        404: {"description": "Media not found"},
    },
    description="Update a media file",
    methods=['PUT', 'PATCH']
)
@extend_schema(
    responses={
        204: {"description": "Media deleted successfully"},
        404: {"description": "Media not found"},
    },
    description="Delete a media file from both database and Cloudinary",
    methods=['DELETE']
)
class MediaDetailAPIView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a media file
    """
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Media.objects.filter(user=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        """
        Delete media file from both database and Cloudinary
        """
        media = self.get_object()
        
        # Delete from Cloudinary
        try:
            import cloudinary.uploader
            cloudinary.uploader.destroy(media.image.public_id)
        except Exception as e:
            # Log the error but continue with database deletion
            print(f"Failed to delete from Cloudinary: {e}")
        
        # Delete from database
        media.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    request=BulkDeleteSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "deleted_count": {"type": "integer"},
                "message": {"type": "string"},
                "cloudinary_warnings": {"type": "array", "items": {"type": "string"}}
            }
        },
        400: {"description": "Bad request - validation errors"},
    },
    description="Bulk delete multiple media files"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_delete_media(request):
    """
    Bulk delete media files
    """
    serializer = BulkDeleteSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    media_ids = serializer.validated_data['ids']
    
    # Get media objects to delete
    media_objects = Media.objects.filter(id__in=media_ids, user=request.user)
    
    deleted_count = 0
    cloudinary_errors = []
    
    with transaction.atomic():
        for media in media_objects:
            # Try to delete from Cloudinary
            try:
                import cloudinary.uploader
                cloudinary.uploader.destroy(media.image.public_id)
            except Exception as e:
                cloudinary_errors.append(f"Media {media.id}: {str(e)}")
            
            # Delete from database
            media.delete()
            deleted_count += 1
    
    response_data = {
        'deleted_count': deleted_count,
        'message': f'Successfully deleted {deleted_count} media files'
    }
    
    if cloudinary_errors:
        response_data['cloudinary_warnings'] = cloudinary_errors
    
    return Response(response_data, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        200: {
            "type": "object",
            "properties": {
                "total_media": {"type": "integer"},
                "total_folders": {"type": "integer"},
                "folders": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "folder_id": {"type": "integer"},
                            "folder_name": {"type": "string"},
                            "media_count": {"type": "integer"},
                            "is_default": {"type": "boolean"}
                        }
                    }
                },
                "recent_media": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/Media"}
                },
                "total_size_bytes": {"type": "integer"}
            }
        },
        500: {"description": "Internal server error"}
    },
    description="Get media statistics for the authenticated user including folder breakdown and recent uploads"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def media_stats(request):
    """
    Get media statistics for the authenticated user
    """
    user = request.user
    
    total_media = Media.objects.filter(user=user).count()
    total_folders = Folder.objects.filter(user=user).count()
    
    # Media by folder
    folders_with_counts = []
    for folder in Folder.objects.filter(user=user):
        media_count = Media.objects.filter(folder=folder).count()
        folders_with_counts.append({
            'folder_id': folder.id,
            'folder_name': folder.name,
            'media_count': media_count,
            'is_default': folder.is_default
        })
    
    # Recently uploaded media
    recent_media = Media.objects.filter(user=user).order_by('-created_at')[:5]
    recent_media_data = MediaSerializer(recent_media, many=True, context={'request': request}).data
    
    # Total file size (if available)
    total_size = Media.objects.filter(
        user=user, 
        file_size__isnull=False
    ).aggregate(
        total=Sum('file_size')
    )['total'] or 0
    
    return Response({
        'total_media': total_media,
        'total_folders': total_folders,
        'folders': folders_with_counts,
        'recent_media': recent_media_data,
        'total_size_bytes': total_size
    })


@extend_schema(
    request={
        "type": "object",
        "properties": {
            "media_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "List of media IDs to move"
            },
            "folder_id": {
                "type": "integer",
                "description": "Target folder ID"
            }
        },
        "required": ["media_ids", "folder_id"]
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "updated_count": {"type": "integer"},
                "message": {"type": "string"}
            }
        },
        400: {"description": "Bad request - validation errors"},
    },
    description="Move multiple media files to a different folder"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def move_media_to_folder(request):
    """
    Move media files to a different folder
    """
    media_ids = request.data.get('media_ids', [])
    folder_id = request.data.get('folder_id')
    
    if not media_ids or not isinstance(media_ids, list):
        return Response(
            {'error': 'media_ids must be provided as a list'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not folder_id:
        return Response(
            {'error': 'folder_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        folder = Folder.objects.get(id=folder_id, user=request.user)
    except Folder.DoesNotExist:
        return Response(
            {'error': 'Invalid folder ID'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update media files
    updated_count = Media.objects.filter(
        id__in=media_ids, 
        user=request.user
    ).update(folder=folder)
    
    return Response({
        'updated_count': updated_count,
        'message': f'Moved {updated_count} media files to {folder.name}'
    })