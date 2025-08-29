from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

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
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer,
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

        # Allow unauthenticated access to password reset endpoints
        if self.action in ("password_reset_request", "password_reset_confirm"):
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

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: None}
    )
    @action(["post"], url_path="password-reset/request", detail=False)
    def password_reset_request(self, request, *args, **kwargs):
        """Send password reset email if the username exists. Always returns 200."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"].strip().lower()
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            # Don't reveal whether the username exists
            return Response({"detail": "If an account with that username exists, a reset email has been sent."}, status=status.HTTP_200_OK)

        # Build uid and token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Construct reset link for frontend to consume
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_path = f"/reset-password/?uid={uid}&token={token}"
        reset_url = frontend_url.rstrip("/") + reset_path

        # Render email body (simple plaintext)
        subject = "Reset your Elevate password"
        message = render_to_string("registration/password_reset_email.html", {
            'protocol': 'https' if not settings.DEBUG else 'http',
            'domain': request.get_host(),
            'uid': uid,
            'token': token,
            'reset_url': reset_url,
            'user': user,
        })

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)

        return Response({"detail": "If an account with that username exists, a reset email has been sent."}, status=status.HTTP_200_OK)

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: None, 400: None}
    )
    @action(["post"], url_path="password-reset/confirm", detail=False)
    def password_reset_confirm(self, request, *args, **kwargs):
        """Confirm password reset using uid and token and set new password."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]

        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)
        except Exception:
            return Response({"detail": "Invalid uid/token."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        # All good - set password
        user.set_password(serializer.validated_data["password"])
        user.save()

        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)

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


# --- SimpleJWT login view that uses the custom serializer ---
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer