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
    UserProfile, CustomLink, SocialIcon, CTABanner, 
    LinkClick, ProfileView, BannerClick
)
from ..serializers import (
    UserProfileSerializer, UserProfilePublicSerializer,
    CustomLinkSerializer, CustomLinkCreateUpdateSerializer,
    SocialIconSerializer, CTABannerSerializer,
    ProfileAnalyticsSerializer
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
                            'text': link.text,
                            'url': link.url,
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

    def perform_create(self, serializer):
        # Debug: Log what we're receiving
        print("DEBUG - Request data:", dict(self.request.data))
        print("DEBUG - Request files:", dict(self.request.FILES))
        print("DEBUG - Content type:", self.request.content_type)
        
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
            'link_text': link.text,
            'link_url': link.url,
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
            "redirect_url": link.url
        }, status=status.HTTP_201_CREATED)


class SocialIconViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing social media icons in storefront.
    """
    serializer_class = SocialIconSerializer
    permission_classes = [IsAuthenticated, StorefrontPermission]

    def get_queryset(self):
        return SocialIcon.objects.filter(
            user_profile__user=self.request.user
        )

    def perform_create(self, serializer):
        profile = get_object_or_404(UserProfile, user=self.request.user)
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