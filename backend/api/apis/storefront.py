import re
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import models
from django.db.models import F
from django.utils import timezone
from datetime import datetime, timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model

from ..models import (
    UserProfile, CustomLink, CollectInfoField, CollectInfoResponse, SocialIcon, CTABanner, 
    LinkClick, ProfileView, BannerClick, Order
)
from ..serializers import (
    UserProfileSerializer, UserProfilePublicSerializer,
    CustomLinkSerializer, CustomLinkCreateUpdateSerializer,
    CollectInfoFieldCreateUpdateSerializer, CollectInfoResponseCreateSerializer,
    SocialIconSerializer, CTABannerSerializer,
    ProfileAnalyticsSerializer, OrderSerializer
)
from ..utils import (
    get_client_ip, anonymize_ip, should_track_analytics, 
    sanitize_referrer, is_rate_limited
)
from ..permissions import (
    StorefrontPermission, PublicProfilePermission,
    MaxCustomLinksPermission
)

User = get_user_model()


class UserProfileStorefrontViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profile storefront data.
    Handles profile updates, image uploads, and public profile access.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action in ['retrieve_public', 'track_view']:
            return UserProfile.objects.filter(is_active=True)
        return UserProfile.objects.filter(user=self.request.user)

    def get_permissions(self):
        if self.action == 'retrieve_public':
            return [PublicProfilePermission()]
        elif self.action == 'track_view':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'retrieve_public':
            return UserProfilePublicSerializer
        return UserProfileSerializer

    @extend_schema(
        summary="Get public profile by username",
        parameters=[
            OpenApiParameter(
                name='username',
                location=OpenApiParameter.PATH,
                description='Username to fetch profile for',
                required=True,
                type=str
            )
        ],
        responses={200: UserProfilePublicSerializer, 404: None}
    )
    @action(["get"], detail=False, url_path="public/(?P<username>[^/.]+)")
    def retrieve_public(self, request, username=None):
        """
        Get public profile by username for /username routing.
        Returns profile with all storefront components.
        """
        try:
            user = User.objects.get(username__iexact=username)
            profile = get_object_or_404(UserProfile, user=user, is_active=True)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Track profile view",
        parameters=[
            OpenApiParameter(
                name='username',
                location=OpenApiParameter.PATH,
                description='Username to track view for',
                required=True,
                type=str
            )
        ]
    )
    @action(["post"], detail=False, url_path="track-view/(?P<username>[^/.]+)", permission_classes=[AllowAny])
    def track_view(self, request, username=None):
        """
        Track a profile view for analytics with rate limiting and privacy protection.
        """
        try:
            user = User.objects.get(username__iexact=username)
            profile = get_object_or_404(UserProfile, user=user, is_active=True)
            
            # Rate limiting check
            client_ip = get_client_ip(request)
            if is_rate_limited(f"{client_ip}:{profile.id}", 'profile_view', limit=10, window=300):
                return Response(
                    {"detail": "Rate limit exceeded"}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Check if we should track this view (prevents spam)
            if not should_track_analytics(request, profile.id):
                # Still return success but don't track
                return Response({"tracked": True}, status=status.HTTP_201_CREATED)
            
            # Get and sanitize client info
            anonymized_ip = anonymize_ip(client_ip)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:1000]  # Limit length
            referrer = sanitize_referrer(request.META.get('HTTP_REFERER', ''))
            
            # Create profile view record with anonymized data
            try:
                ProfileView.objects.create(
                    user_profile=profile,
                    ip_address=anonymized_ip,
                    user_agent=user_agent,
                    referrer=referrer
                )
                
                # Update view count on the profile
                profile.view_count = F('view_count') + 1
                profile.save(update_fields=['view_count'])
            except Exception:
                # Log error but don't fail the request
                # Users should still be able to view profiles even if tracking fails
                pass
            
            return Response({"tracked": True}, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Get comprehensive dashboard statistics",
        responses={200: "Dashboard statistics including all analytics data"}
    )
    @action(["get"], detail=False, url_path="dashboard-stats")
    def get_dashboard_stats(self, request):
        """
        Get comprehensive dashboard statistics for the authenticated user.
        Returns all analytics data in a single API call.
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        
        # Date range for analytics (last 30 days by default)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Profile analytics
        profile_views = ProfileView.objects.filter(
            user_profile=profile,
            viewed_at__gte=start_date
        ).count()
        
        # Custom Links analytics
        custom_links = CustomLink.objects.filter(user_profile=profile)
        total_link_clicks = sum(link.click_count for link in custom_links)
        active_links_count = custom_links.filter(is_active=True).count()
        
        # CTA Banner analytics
        cta_banner = CTABanner.objects.filter(user_profile=profile).first()
        banner_clicks = cta_banner.click_count if cta_banner else 0
        banner_active = cta_banner.is_active if cta_banner else False
        
        # Social Icons count
        social_icons = SocialIcon.objects.filter(user_profile=profile)
        active_social_icons = social_icons.filter(is_active=True).count()
        
        # Recent activity (last 7 days)
        recent_date = end_date - timedelta(days=7)
        recent_views = ProfileView.objects.filter(
            user_profile=profile,
            viewed_at__gte=recent_date
        ).count()
        
        recent_link_clicks = LinkClick.objects.filter(
            user_profile=profile,
            clicked_at__gte=recent_date
        ).count()
        
        recent_banner_clicks = BannerClick.objects.filter(
            banner__user_profile=profile,
            timestamp__gte=recent_date
        ).count() if cta_banner else 0
        
        # Top performing links
        top_links = custom_links.filter(is_active=True).order_by('-click_count')[:5]
        
        # Daily breakdown (last 7 days)
        daily_stats = []
        for i in range(7):
            day = end_date.date() - timedelta(days=i)
            day_start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
            day_end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
            
            day_views = ProfileView.objects.filter(
                user_profile=profile,
                viewed_at__gte=day_start,
                viewed_at__lte=day_end
            ).count()
            
            day_clicks = LinkClick.objects.filter(
                user_profile=profile,
                clicked_at__gte=day_start,
                clicked_at__lte=day_end
            ).count()
            
            daily_stats.append({
                'date': day.isoformat(),
                'views': day_views,
                'clicks': day_clicks
            })
        
        return Response({
            'profile': {
                'id': profile.id,
                'username': profile.user.username,
                'display_name': profile.display_name,
                'total_views': profile.view_count,
                'is_active': profile.is_active
            },
            'analytics': {
                'period_days': 30,
                'profile_views': profile_views,
                'recent_views': recent_views,
                'total_link_clicks': total_link_clicks,
                'recent_link_clicks': recent_link_clicks,
                'banner_clicks': banner_clicks,
                'recent_banner_clicks': recent_banner_clicks
            },
            'components': {
                'custom_links': {
                    'total': custom_links.count(),
                    'active': active_links_count,
                    'top_performing': [
                        {
                            'id': link.id,
                            'title': link.title or link.button_text or 'Untitled',
                            'style': link.style,
                            'click_count': link.click_count,
                            'order': link.order
                        } for link in top_links
                    ]
                },
                'cta_banner': {
                    'exists': bool(cta_banner),
                    'active': banner_active,
                    'clicks': banner_clicks
                },
                'social_icons': {
                    'total': social_icons.count(),
                    'active': active_social_icons
                }
            },
            'daily_breakdown': daily_stats
        })

    @extend_schema(
        summary="Upload profile image",
        request={"multipart/form-data": {"type": "object", "properties": {"image": {"type": "string", "format": "binary"}}}},
        responses={200: UserProfileSerializer}
    )
    @action(["post"], detail=False, url_path="upload-image", parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request):
        """
        Upload profile image.
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        
        if 'image' not in request.FILES:
            return Response(
                {"detail": "No image file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.profile_image = request.FILES['image']
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @extend_schema(
        summary="Update profile information",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer}
    )
    @action(["put", "patch"], detail=False, url_path="update")
    def update_profile(self, request):
        """
        Update profile information (display_name, bio, embedded_video).
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        
        # Validate YouTube/Vimeo URL if provided
        embedded_video = request.data.get('embedded_video', '')
        if embedded_video:
            request.data['embedded_video'] = self.validate_video_url(embedded_video)
        
        serializer = self.get_serializer(
            profile, 
            data=request.data, 
            partial=request.method == 'PATCH'
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)

    @extend_schema(
        summary="Get profile analytics",
        responses={200: ProfileAnalyticsSerializer}
    )
    @action(["get"], detail=False, url_path="analytics")
    def analytics(self, request):
        """
        Get profile analytics (views, clicks, etc.) with date range support.
        Query params: days (default: 30), start_date, end_date
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        
        # Parse date range from query params
        try:
            days = int(request.GET.get('days', 30))
            if days > 365:  # Limit to 1 year max
                days = 365
            
            # Allow custom date range
            start_date_str = request.GET.get('start_date')
            end_date_str = request.GET.get('end_date')
            
            if start_date_str and end_date_str:
                from datetime import datetime
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            else:
                end_date = timezone.now()
                start_date = end_date - timedelta(days=days)
        except (ValueError, TypeError):
            # Default fallback
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        
        # Optimize queries with select_related and prefetch_related
        from django.db.models import Count, Q
        
        # Use more efficient queries
        views_count = ProfileView.objects.filter(
            user_profile=profile,
            viewed_at__gte=start_date,
            viewed_at__lte=end_date
        ).count()
        
        clicks_count = LinkClick.objects.filter(
            user_profile=profile,
            clicked_at__gte=start_date,
            clicked_at__lte=end_date
        ).count()
        
        # Top links with click counts (more efficient query)
        top_links = profile.custom_links.filter(
            is_active=True
        ).annotate(
            click_count=Count(
                'clicks',
                filter=Q(
                    clicks__clicked_at__gte=start_date,
                    clicks__clicked_at__lte=end_date
                )
            )
        ).filter(click_count__gt=0).order_by('-click_count')[:10]  # Top 10 instead of 5
        
        # Recent activity for better insights
        recent_views = ProfileView.objects.filter(
            user_profile=profile,
            viewed_at__gte=start_date,
            viewed_at__lte=end_date
        ).values('viewed_at__date').annotate(
            count=Count('id')
        ).order_by('viewed_at__date')[:30]  # Limit to prevent large responses
        
        analytics_data = {
            'profile_id': profile.id,
            'total_views': views_count,
            'total_clicks': clicks_count,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days
            },
            'top_links': CustomLinkSerializer(top_links, many=True).data,
            'daily_views': list(recent_views)  # Add daily breakdown
        }
        
        serializer = ProfileAnalyticsSerializer(analytics_data)
        return Response(serializer.data)

    def validate_video_url(self, url):
        """
        Validate and convert YouTube/Vimeo URLs to embed format.
        """
        if not url:
            return url
            
        # YouTube URL patterns
        youtube_patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)',
            r'youtube\.com\/embed\/([a-zA-Z0-9_-]+)'
        ]
        
        for pattern in youtube_patterns:
            match = re.search(pattern, url)
            if match:
                video_id = match.group(1)
                return f"https://www.youtube.com/embed/{video_id}"
        
        # Vimeo URL patterns
        vimeo_pattern = r'vimeo\.com\/(?:video\/)?(\d+)'
        match = re.search(vimeo_pattern, url)
        if match:
            video_id = match.group(1)
            return f"https://player.vimeo.com/video/{video_id}"
        
        # If it's already an embed URL or unknown format, return as-is
        return url


class CustomLinkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing custom links in storefront.
    Users can have up to 10 active custom links.
    """
    serializer_class = CustomLinkSerializer
    permission_classes = [IsAuthenticated, StorefrontPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.action == 'track_click':
            return CustomLink.objects.filter(is_active=True)
        return CustomLink.objects.filter(
            user_profile__user=self.request.user
        ).order_by('order')

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), MaxCustomLinksPermission()]
        elif self.action == 'track_click':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CustomLinkCreateUpdateSerializer
        return CustomLinkSerializer

    def create(self, request, *args, **kwargs):
        print("DEBUG - CREATE method called")
        print("DEBUG - Request data:", dict(request.data))
        print("DEBUG - Content type:", request.content_type)
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print("DEBUG - Exception during create:", str(e))
            # Get serializer to check validation errors
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print("DEBUG - Serializer validation errors:", serializer.errors)
            raise

    def perform_create(self, serializer):
        print("DEBUG - Request data:", dict(self.request.data))
        print("DEBUG - Is valid:", serializer.is_valid())
        if not serializer.is_valid():
            print("DEBUG - Serializer errors:", serializer.errors)
            return
        
        profile = get_object_or_404(UserProfile, user=self.request.user)
        
        # Auto-assign order if not provided
        if not serializer.validated_data.get('order'):
            max_order = CustomLink.objects.filter(
                user_profile=profile
            ).aggregate(models.Max('order'))['order__max'] or 0
            serializer.validated_data['order'] = max_order + 1
            
        serializer.save(user_profile=profile)

    @extend_schema(
        summary="Reorder custom links",
        request={"type": "array", "items": {"type": "object", "properties": {"id": {"type": "integer"}, "order": {"type": "integer"}}}},
        responses={200: CustomLinkSerializer(many=True)}
    )
    @action(["post"], detail=False, url_path="reorder")
    def reorder(self, request):
        """
        Reorder custom links by updating their order field.
        Expects: [{"id": 1, "order": 1}, {"id": 2, "order": 2}, ...]
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        link_orders = request.data
        
        if not isinstance(link_orders, list):
            return Response(
                {"detail": "Expected a list of link orders"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            for item in link_orders:
                link_id = item.get('id')
                order = item.get('order')
                
                if link_id and order is not None:
                    CustomLink.objects.filter(
                        id=link_id,
                        user_profile=profile
                    ).update(order=order)
        
        # Return updated links
        links = self.get_queryset()
        serializer = self.get_serializer(links, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get link analytics",
        description="Get analytics data for a specific custom link including clicks, referrers, etc.",
        responses={200: {"type": "object"}}
    )
    @action(["get"], detail=True, url_path="analytics")
    def analytics(self, request, pk=None):
        """
        Get analytics data for a specific custom link.
        """
        link = self.get_object()
        
        # Get date range parameters
        days = int(request.GET.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get link clicks for this specific link
        link_clicks = LinkClick.objects.filter(
            custom_link=link,
            clicked_at__date__gte=start_date,
            clicked_at__date__lte=end_date
        )
        
        # Calculate metrics
        total_clicks = link_clicks.count()
        unique_clicks = link_clicks.values('ip_address').distinct().count()
        
        # Top referrers
        referrer_data = (
            link_clicks
            .exclude(referrer__isnull=True)
            .exclude(referrer__exact='')
            .values('referrer')
            .annotate(clicks=models.Count('id'))
            .order_by('-clicks')[:5]
        )
        
        top_referrers = [
            {
                'source': item['referrer'] if item['referrer'] else 'Direct',
                'clicks': item['clicks']
            }
            for item in referrer_data
        ]
        
        # Add direct clicks (no referrer)
        direct_clicks = link_clicks.filter(
            models.Q(referrer__isnull=True) | models.Q(referrer__exact='')
        ).count()
        
        if direct_clicks > 0:
            top_referrers.append({
                'source': 'Direct',
                'clicks': direct_clicks
            })
        
        # Daily clicks for the last 7 days
        daily_clicks = []
        for i in range(7):
            date = end_date - timedelta(days=6-i)
            day_clicks = link_clicks.filter(clicked_at__date=date).count()
            daily_clicks.append({
                'date': date.isoformat(),
                'clicks': day_clicks
            })
        
        # Calculate click-through rate (if we have profile views)
        profile_views = ProfileView.objects.filter(
            user_profile=link.user_profile,
            viewed_at__date__gte=start_date,
            viewed_at__date__lte=end_date
        ).count()
        
        click_through_rate = 0
        if profile_views > 0:
            click_through_rate = round((total_clicks / profile_views) * 100, 2)
        
        analytics_data = {
            'link_id': link.id,
            'link_title': link.title or link.button_text or 'Untitled',
            'link_style': link.style,
            'total_clicks': total_clicks,
            'unique_clicks': unique_clicks,
            'click_through_rate': click_through_rate,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            },
            'top_referrers': top_referrers,
            'daily_clicks': daily_clicks
        }
        
        return Response(analytics_data)

    @extend_schema(
        summary="Track link click",
        parameters=[
            OpenApiParameter(name='link_id', location=OpenApiParameter.PATH, required=True, type=int)
        ]
    )
    @action(["post"], detail=True, url_path="track-click", permission_classes=[PublicProfilePermission])
    def track_click(self, request, pk=None):
        """
        Track a click on a custom link for analytics with rate limiting and privacy protection.
        """
        link = get_object_or_404(CustomLink, pk=pk, is_active=True)
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if is_rate_limited(f"{client_ip}:{link.id}", 'link_click', limit=20, window=300):
            return Response(
                {"detail": "Rate limit exceeded"}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Check if we should track this click (prevents spam)
        if should_track_analytics(request, link.user_profile.id):
            # Get and sanitize client info
            anonymized_ip = anonymize_ip(client_ip)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:1000]  # Limit length
            referrer = sanitize_referrer(request.META.get('HTTP_REFERER', ''))
            
            # Create click record with anonymized data
            try:
                LinkClick.objects.create(
                    user_profile=link.user_profile,
                    custom_link=link,
                    ip_address=anonymized_ip,
                    user_agent=user_agent,
                    referrer=referrer
                )
                
                # Update click count on the link
                link.click_count = F('click_count') + 1
                link.save(update_fields=['click_count'])
            except Exception:
                # Log error but don't fail the request
                # Users should still be redirected even if tracking fails
                pass
        
        return Response({
            "tracked": True,
            "link_id": link.id,
            "link_style": link.style
        }, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Submit collect info form",
        request=CollectInfoResponseCreateSerializer,
        responses={201: CollectInfoResponseCreateSerializer}
    )
    @action(["post"], detail=True, url_path="submit-form", permission_classes=[AllowAny])
    def submit_form(self, request, pk=None):
        """
        Submit a form for a custom link with collect info fields.
        """
        link = get_object_or_404(CustomLink, pk=pk, is_active=True)
        
        # Check if link has collect info fields
        if not link.collect_info_fields.exists():
            return Response(
                {"detail": "This link has no collect info fields"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if is_rate_limited(f"{client_ip}:{link.id}", 'form_submit', limit=5, window=300):
            return Response(
                {"detail": "Rate limit exceeded"}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Get client info for submission tracking
        client_ip_anonymized = anonymize_ip(client_ip)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:1000]
        
        # Prepare serializer data
        submission_data = request.data.copy()
        submission_data['ip_address'] = client_ip_anonymized
        submission_data['user_agent'] = user_agent
        
        # Create serializer with custom link context
        serializer = CollectInfoResponseCreateSerializer(
            data=submission_data,
            context={'request': request, 'custom_link': link}
        )
        serializer.is_valid(raise_exception=True)
        
        # Save the response
        response_obj = serializer.save(custom_link=link)
        
        return Response({
            "success": True,
            "response_id": response_obj.id,
            "message": "Form submitted successfully"
        }, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Get collect info fields for a link",
        responses={200: CollectInfoFieldCreateUpdateSerializer(many=True)}
    )
    @action(["get"], detail=True, url_path="collect-fields", permission_classes=[AllowAny])
    def get_collect_fields(self, request, pk=None):
        """
        Get the collect info fields for a custom link (public endpoint).
        """
        link = get_object_or_404(CustomLink, pk=pk, is_active=True)
        fields = link.collect_info_fields.all().order_by('order')
        
        # Return 404 if link has no collect info fields
        if not fields.exists():
            return Response(
                {"detail": "This link has no collect info fields"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CollectInfoFieldCreateUpdateSerializer(fields, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Manage collect info fields",
        request=CollectInfoFieldCreateUpdateSerializer(many=True),
        responses={200: CollectInfoFieldCreateUpdateSerializer(many=True)}
    )
    @action(["post", "put"], detail=True, url_path="collect-fields/manage")
    def manage_collect_fields(self, request, pk=None):
        """
        Create or update collect info fields for a custom link (authenticated endpoint).
        """
        link = get_object_or_404(
            CustomLink, 
            pk=pk, 
            user_profile__user=request.user
        )
        
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Expected a list of field objects"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing fields and create new ones
        with transaction.atomic():
            link.collect_info_fields.all().delete()
            
            created_fields = []
            for field_data in request.data:
                serializer = CollectInfoFieldCreateUpdateSerializer(data=field_data)
                serializer.is_valid(raise_exception=True)
                field = serializer.save(custom_link=link)
                created_fields.append(field)
        
        # Return the created fields
        serializer = CollectInfoFieldCreateUpdateSerializer(created_fields, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get form responses for a collect info link",
        responses={200: CollectInfoResponseCreateSerializer(many=True)}
    )
    @action(["get"], detail=True, url_path="responses")
    def get_responses(self, request, pk=None):
        """
        Get form responses for a custom link with collect info fields (owner only).
        """
        link = get_object_or_404(
            CustomLink, 
            pk=pk, 
            user_profile__user=request.user
        )
        
        # Get query parameters for filtering
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        responses = link.collect_info_responses.all().order_by('-submitted_at')[offset:offset+limit]
        
        # Serialize responses with additional metadata
        response_data = []
        for response in responses:
            response_data.append({
                'id': response.id,
                'responses': response.responses,
                'ip_address': response.ip_address,
                'user_agent': response.user_agent,
                'submitted_at': response.submitted_at.isoformat(),
            })
        
        return Response({
            'total_responses': link.collect_info_responses.count(),
            'responses': response_data
        })

    @extend_schema(
        summary="Create order for digital product",
        request=OrderSerializer,
        responses={201: OrderSerializer}
    )
    @action(["post"], detail=True, url_path="create-order", permission_classes=[AllowAny])
    def create_order(self, request, pk=None):
        """
        Create an order for a digital product with form responses.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"DEBUG - Creating order for link ID: {pk}")
        logger.info(f"DEBUG - Request data: {request.data}")
        
        link = get_object_or_404(CustomLink, pk=pk, is_active=True)
        logger.info(f"DEBUG - Found link: {link.title}, type: {link.type}, owner: {link.user_profile.user.username}")

        # Check if this is a freebie/free product
        is_free_product = not link.checkout_price or link.checkout_price <= 0
        logger.info(f"DEBUG - Is free product: {is_free_product}, checkout_price: {link.checkout_price}")
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if is_rate_limited(f"{client_ip}:{link.id}", 'order_create', limit=20, window=300):
            return Response(
                {"detail": "Rate limit exceeded"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Prepare order data
        order_data = request.data.copy()
        order_data['custom_link'] = link.id
        logger.info(f"DEBUG - Prepared order data: {order_data}")
        
        # Create serializer with custom link context
        serializer = OrderSerializer(
            data=order_data,
            context={'request': request, 'custom_link': link}
        )
        
        
        print("DEBUG - Order serializer data:", serializer.initial_data)

        try:
            serializer.is_valid(raise_exception=True)
            logger.info("DEBUG - Order serializer is valid")
        except Exception as e:
            logger.error(f"DEBUG - Order serializer validation failed: {e}")
            logger.error(f"DEBUG - Serializer errors: {serializer.errors}")
            return Response({
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save the order
        try:
            order = serializer.save()
            logger.info(f"DEBUG - Created order: {order.order_id}")
        except Exception as e:
            logger.error(f"DEBUG - Failed to save order: {e}", exc_info=True)
            return Response({
                "error": "Failed to create order",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle free products differently - no Stripe payment needed
        if is_free_product:
            logger.info("DEBUG - Processing free product order")

            try:
                # Mark order as completed immediately
                logger.info(f"DEBUG - Marking order {order.order_id} as completed")
                order.status = 'completed'
                order.save(update_fields=['status'])

                logger.info(f"DEBUG - Free product order {order.order_id} marked as completed")

                # For free products, we can provide direct download access
                # No need for payment processing
                return Response({
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "is_free": True,
                    "message": "Free download ready! No payment required.",
                    "download_access": True
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"DEBUG - Error processing free order: {e}", exc_info=True)
                return Response({
                    "error": "Failed to process free order",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create Stripe Connect checkout session for paid products
        try:
            from ..services.stripe_connect_service import StripeConnectService
            
            # Get the seller's Connect account
            seller_user = link.user_profile.user
            logger.info(f"DEBUG - Seller user: {seller_user.username}")
            
            connect_account = getattr(seller_user, 'connect_account', None)
            logger.info(f"DEBUG - Connect account found: {connect_account is not None}")
            
            if not connect_account:
                logger.error("DEBUG - No Stripe Connect account found for seller")
                return Response({
                    "error": "Seller has not connected their Stripe account"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"DEBUG - Connect account details: ID={connect_account.stripe_account_id}, charges_enabled={connect_account.charges_enabled}")
            
            if not connect_account.charges_enabled:
                logger.error("DEBUG - Stripe account not ready for charges")
                return Response({
                    "error": "Seller's Stripe account is not yet ready to accept payments"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create checkout session
            logger.info("DEBUG - Creating Stripe checkout session")
            stripe_service = StripeConnectService()
            
            from django.conf import settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            success_url = f"{frontend_url}/order-success?order_id={order.order_id}"
            cancel_url = f"{frontend_url}?order_cancelled=true&order_id={order.order_id}"
            
            logger.info(f"DEBUG - Success URL: {success_url}")
            logger.info(f"DEBUG - Cancel URL: {cancel_url}")
            
            checkout_url, session_id = stripe_service.create_checkout_session_for_product(
                custom_link=link,
                connect_account=connect_account,
                success_url=success_url,
                cancel_url=cancel_url,
                order_id=order.order_id,  # Pass the existing order ID
                customer_email=order.customer_email,
                metadata={'order_id': order.order_id}
            )
            
            logger.info(f"DEBUG - Checkout session created: {session_id}")
            
            # PaymentTransaction is now created by the StripeConnectService
            
            return Response({
                "success": True,
                "order": OrderSerializer(order).data,
                "checkout_url": checkout_url,
                "message": "Order created successfully. Redirecting to payment..."
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # If Stripe checkout fails, we still have the order created
            # Log the error but don't fail the entire request
            logger.error(f"DEBUG - Failed to create Stripe checkout session for order {order.order_id}: {str(e)}")
            logger.error(f"DEBUG - Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"DEBUG - Full traceback: {traceback.format_exc()}")
            
            return Response({
                "success": True,
                "order": OrderSerializer(order).data,
                "error": f"Order created but payment setup failed: {str(e)}",
                "message": "Order created but payment processing is currently unavailable"
            }, status=status.HTTP_201_CREATED)

    @action(["post"], detail=True, url_path="create-order-embedded", permission_classes=[AllowAny])
    def create_order_embedded(self, request, pk=None):
        """
        Create an order for a digital product with embedded Stripe checkout.
        This endpoint creates a Stripe session with ui_mode='embedded' and returns
        the client_secret for inline checkout rendering.
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"DEBUG - Creating embedded checkout order for link ID: {pk}")
        logger.info(f"DEBUG - Request data: {request.data}")

        link = get_object_or_404(CustomLink, pk=pk, is_active=True)
        logger.info(f"DEBUG - Found link: {link.title}, type: {link.type}, owner: {link.user_profile.user.username}")

        # Check if this is a freebie/free product
        is_free_product = not link.checkout_price or link.checkout_price <= 0
        logger.info(f"DEBUG - Is free product: {is_free_product}, checkout_price: {link.checkout_price}")

        # Rate limiting check
        client_ip = get_client_ip(request)
        if is_rate_limited(f"{client_ip}:{link.id}", 'order_create', limit=20, window=300):
            return Response(
                {"detail": "Rate limit exceeded"},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Prepare order data
        order_data = request.data.copy()
        order_data['custom_link'] = link.id
        logger.info(f"DEBUG - Prepared order data: {order_data}")

        # Create serializer with custom link context
        serializer = OrderSerializer(
            data=order_data,
            context={'request': request, 'custom_link': link}
        )

        try:
            serializer.is_valid(raise_exception=True)
            logger.info("DEBUG - Order serializer is valid")
        except Exception as e:
            logger.error(f"DEBUG - Order serializer validation failed: {e}")
            logger.error(f"DEBUG - Serializer errors: {serializer.errors}")
            return Response({
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save the order
        try:
            order = serializer.save()
            logger.info(f"DEBUG - Created order: {order.order_id}")
        except Exception as e:
            logger.error(f"DEBUG - Failed to save order: {e}", exc_info=True)
            return Response({
                "error": "Failed to create order",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle free products differently - no Stripe payment needed
        if is_free_product:
            logger.info("DEBUG - Processing free product order")

            try:
                # Mark order as completed immediately
                logger.info(f"DEBUG - Marking order {order.order_id} as completed")
                order.status = 'completed'
                order.save(update_fields=['status'])

                logger.info(f"DEBUG - Free product order {order.order_id} marked as completed")

                return Response({
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "is_free": True,
                    "message": "Free download ready! No payment required.",
                    "download_access": True
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"DEBUG - Error processing free order: {e}", exc_info=True)
                return Response({
                    "error": "Failed to process free order",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create Stripe Connect EMBEDDED checkout session for paid products
        try:
            from ..services.stripe_connect_service import StripeConnectService

            # Get the seller's Connect account
            seller_user = link.user_profile.user
            logger.info(f"DEBUG - Seller user: {seller_user.username}")

            connect_account = getattr(seller_user, 'connect_account', None)
            logger.info(f"DEBUG - Connect account found: {connect_account is not None}")

            if not connect_account:
                logger.error("DEBUG - No Stripe Connect account found for seller")
                return Response({
                    "error": "Seller has not connected their Stripe account"
                }, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"DEBUG - Connect account details: ID={connect_account.stripe_account_id}, charges_enabled={connect_account.charges_enabled}")

            if not connect_account.charges_enabled:
                logger.error("DEBUG - Stripe account not ready for charges")
                return Response({
                    "error": "Seller's Stripe account is not yet ready to accept payments"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create EMBEDDED checkout session
            logger.info("DEBUG - Creating Stripe EMBEDDED checkout session")
            stripe_service = StripeConnectService()

            # Don't pass return_url for embedded mode - we handle completion in the modal
            # This prevents Stripe from redirecting after payment
            client_secret, session_id = stripe_service.create_embedded_checkout_session_for_product(
                custom_link=link,
                connect_account=connect_account,
                order_id=order.order_id,
                customer_email=order.customer_email,
                metadata={'order_id': order.order_id}
            )

            logger.info(f"DEBUG - Embedded checkout session created: {session_id}")

            return Response({
                "success": True,
                "order": OrderSerializer(order).data,
                "client_secret": client_secret,  # Return client_secret instead of checkout_url
                "session_id": session_id,
                "message": "Order created successfully. Complete payment below."
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # If Stripe checkout fails, we still have the order created
            logger.error(f"DEBUG - Failed to create Stripe embedded checkout session for order {order.order_id}: {str(e)}")
            logger.error(f"DEBUG - Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"DEBUG - Full traceback: {traceback.format_exc()}")

            return Response({
                "success": True,
                "order": OrderSerializer(order).data,
                "error": f"Order created but payment setup failed: {str(e)}",
                "message": "Order created but payment processing is currently unavailable"
            }, status=status.HTTP_201_CREATED)


class SocialIconViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing social media icons in storefront.
    """
    serializer_class = SocialIconSerializer
    permission_classes = [IsAuthenticated, StorefrontPermission]

    def create(self, request, *args, **kwargs):
        print(f"DEBUG - SocialIcon create called with data: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"DEBUG - SocialIcon create failed: {e}")
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"DEBUG - Serializer validation errors: {serializer.errors}")
            raise

    def get_queryset(self):
        return SocialIcon.objects.filter(
            user_profile__user=self.request.user
        )

    def perform_create(self, serializer):
        print(f"DEBUG - SocialIcon perform_create called with data: {serializer.validated_data}")
        profile = get_object_or_404(UserProfile, user=self.request.user)
        print(f"DEBUG - User profile: {profile}, User: {self.request.user}")

        # Check if we already have a social icon with this platform
        platform = serializer.validated_data.get('platform')
        existing_icon = SocialIcon.objects.filter(user_profile=profile, platform=platform).first()
        if existing_icon:
            print(f"DEBUG - Found existing social icon for platform {platform}: {existing_icon.id}")
        else:
            print(f"DEBUG - Creating new social icon for platform {platform}")

        serializer.save(user_profile=profile)


class CTABannerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing CTA banner in storefront.
    Each user can have only one CTA banner.
    """
    serializer_class = CTABannerSerializer
    permission_classes = [IsAuthenticated, StorefrontPermission]

    def get_permissions(self):
        if self.action == 'track_click':
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.action == 'track_click':
            return CTABanner.objects.filter(is_active=True)
        return CTABanner.objects.filter(
            user_profile__user=self.request.user
        )

    def perform_create(self, serializer):
        profile = get_object_or_404(UserProfile, user=self.request.user)
        
        # Delete existing CTA banner if any (since it's one-to-one)
        CTABanner.objects.filter(user_profile=profile).delete()
        
        serializer.save(user_profile=profile)

    @extend_schema(
        summary="Track CTA banner click",
        parameters=[
            OpenApiParameter(name='banner_id', location=OpenApiParameter.PATH, required=True, type=int)
        ]
    )
    @action(["post"], detail=True, url_path="track-click", permission_classes=[PublicProfilePermission])
    def track_click(self, request, pk=None):
        """
        Track a click on a CTA banner for analytics with rate limiting and privacy protection.
        """
        banner = get_object_or_404(CTABanner, pk=pk, is_active=True)
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if is_rate_limited(f"{client_ip}:{banner.id}", 'banner_click', limit=20, window=300):
            return Response(
                {"detail": "Rate limit exceeded"}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Check if we should track this click (prevents spam)
        if should_track_analytics(request, banner.user_profile.id):
            # Get and sanitize client info
            anonymized_ip = anonymize_ip(client_ip)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:1000]  # Limit length
            referrer = request.META.get('HTTP_REFERER', '')[:500]  # Limit referrer length
            
            # Create click record
            BannerClick.objects.create(
                banner=banner,
                ip_address=anonymized_ip,
                user_agent=user_agent,
                referrer=referrer,
                timestamp=timezone.now()
            )
            
            # Update click count on the banner
            banner.click_count = F('click_count') + 1
            banner.save(update_fields=['click_count'])
        
        return Response({
            "detail": "Click tracked successfully",
            "banner_url": banner.button_url
        }, status=status.HTTP_200_OK)