from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from ..models import UserProfile
from ..serializers import (
    UserChangePasswordErrorSerializer,
    UserChangePasswordSerializer,
    UserCreateErrorSerializer,
    UserCreateSerializer,
    UserCurrentErrorSerializer,
    UserCurrentSerializer,
    UserProfileSerializer,
    UserProfilePublicSerializer,
)

User = get_user_model()


class UserViewSet(
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all()
    serializer_class = UserCurrentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(pk=self.request.user.pk)

    def get_permissions(self):
        if self.action == "create" or self.action == "check_username":
            return [AllowAny()]

        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        elif self.action == "me":
            return UserCurrentSerializer
        elif self.action == "change_password":
            return UserChangePasswordSerializer

        return super().get_serializer_class()

    @extend_schema(
        responses={
            200: UserCreateSerializer,
            400: UserCreateErrorSerializer,
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        responses={
            200: UserCurrentSerializer,
            400: UserCurrentErrorSerializer,
        }
    )
    @action(["get", "put", "patch"], detail=False)
    def me(self, request, *args, **kwargs):
        if request.method == "GET":
            serializer = self.get_serializer(self.request.user)
            return Response(serializer.data)
        elif request.method == "PUT":
            serializer = self.get_serializer(
                self.request.user, data=request.data, partial=False
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        elif request.method == "PATCH":
            serializer = self.get_serializer(
                self.request.user, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @extend_schema(
        responses={
            204: None,
            400: UserChangePasswordErrorSerializer,
        }
    )
    @action(["post"], url_path="change-password", detail=False)
    def change_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.request.user.set_password(serializer.data["password_new"])
        self.request.user.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(["delete"], url_path="delete-account", detail=False)
    def delete_account(self, request, *args, **kwargs):
        self.request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        responses={
            200: None,
            400: None,
        }
    )
    @action(["post"], url_path="check-username", detail=False)
    def check_username(self, request, *args, **kwargs):
        """
        Public endpoint to check if a username is available.
        Returns {"available": true/false, "username": "requested_username"}
        """
        username = request.data.get('username', '').strip()
        
        if not username:
            return Response(
                {"error": "Username is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if username exists (case-insensitive)
        is_taken = User.objects.filter(username__iexact=username).exists()
        
        return Response({
            "username": username,
            "available": not is_taken
        }, status=status.HTTP_200_OK)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def get_permissions(self):
        if self.action == "retrieve" and self.lookup_field == 'slug':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "retrieve" and self.lookup_field == 'slug':
            return UserProfilePublicSerializer
        return UserProfileSerializer

    @extend_schema(
        responses={
            200: UserProfilePublicSerializer,
            404: None,
        }
    )
    def retrieve(self, request, *args, **kwargs):
        # For public access by slug
        if self.lookup_field == 'slug':
            profile = get_object_or_404(UserProfile, slug=kwargs['slug'], is_active=True)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return super().retrieve(request, *args, **kwargs)