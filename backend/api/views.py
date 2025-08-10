import json
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from .models import (
    User, UserProfile, SocialIcon, CustomLink, CTABanner, 
    Subscription, TriggerRule, AIChatHistory,
    SocialMediaPlatform, SocialMediaConnection, 
    SocialMediaPost, SocialMediaPostTemplate
)


def dashboard_callback(request, context):
    """Callback function to add custom data to the admin dashboard context."""
    
    # Get basic stats
    user_count = User.objects.count()
    profile_count = UserProfile.objects.count()
    active_subscriptions = Subscription.objects.filter(is_active=True).count()
    social_connections = SocialMediaConnection.objects.filter(is_active=True).count()
    
    # Get data for time-series charts (last 30 days)
    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=29)  # 30 days including today
    
    # Generate dates list
    dates = []
    users_data = []
    posts_data = []
    connections_data = []
    
    for i in range(30):
        date = thirty_days_ago + timedelta(days=i)
        dates.append(date.strftime('%Y-%m-%d'))
        
        # Count users registered each day
        users_data.append(
            User.objects.filter(date_joined__date=date).count()
        )
        
        # Count social posts created each day
        posts_data.append(
            SocialMediaPost.objects.filter(created_at__date=date).count()
        )
        
        # Count connections made each day
        connections_data.append(
            SocialMediaConnection.objects.filter(created_at__date=date).count()
        )
    
    # Get platform distribution data
    platforms = SocialMediaPlatform.objects.filter(is_active=True)
    platform_labels = []
    platform_data = []
    
    for platform in platforms:
        platform_labels.append(platform.display_name)
        count = SocialMediaConnection.objects.filter(
            platform=platform, 
            is_active=True
        ).count()
        platform_data.append(count)
    
    # Get post status distribution
    status_labels = ['Draft', 'Scheduled', 'Sending', 'Sent', 'Failed', 'Cancelled']
    status_values = ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']
    status_data = []
    
    for status in status_values:
        count = SocialMediaPost.objects.filter(status=status).count()
        status_data.append(count)
    
    # Get subscription status data
    active_subs = Subscription.objects.filter(is_active=True).count()
    inactive_subs = Subscription.objects.filter(is_active=False).count()
    sub_labels = ['Active', 'Inactive']
    sub_data = [active_subs, inactive_subs]
    
    # Get recent activity (last 7 days)
    seven_days_ago = today - timedelta(days=6)
    recent_dates = []
    recent_posts = []
    recent_ai_chats = []
    
    for i in range(7):
        date = seven_days_ago + timedelta(days=i)
        recent_dates.append(date.strftime('%m/%d'))
        
        # Count posts per day
        recent_posts.append(
            SocialMediaPost.objects.filter(created_at__date=date).count()
        )
        
        # Count AI chats per day
        recent_ai_chats.append(
            AIChatHistory.objects.filter(created_at__date=date).count()
        )
    
    # Get profile component stats
    total_custom_links = CustomLink.objects.filter(is_active=True).count()
    total_social_icons = SocialIcon.objects.filter(is_active=True).count()
    total_cta_banners = CTABanner.objects.filter(is_active=True).count()
    total_trigger_rules = TriggerRule.objects.filter(is_active=True).count()
    
    # Get top platforms by connections
    top_platforms = SocialMediaConnection.objects.filter(
        is_active=True
    ).values(
        'platform__display_name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    top_platform_names = [p['platform__display_name'] for p in top_platforms]
    top_platform_counts = [p['count'] for p in top_platforms]
    
    # Add all data to context
    context.update({
        # Basic stats
        'user_count': user_count,
        'profile_count': profile_count,
        'active_subscriptions': active_subscriptions,
        'social_connections': social_connections,
        'total_custom_links': total_custom_links,
        'total_social_icons': total_social_icons,
        'total_cta_banners': total_cta_banners,
        'total_trigger_rules': total_trigger_rules,
        
        # JSON data for charts
        'dates_json': json.dumps(dates),
        'users_data_json': json.dumps(users_data),
        'posts_data_json': json.dumps(posts_data),
        'connections_data_json': json.dumps(connections_data),
        'platform_labels_json': json.dumps(platform_labels),
        'platform_data_json': json.dumps(platform_data),
        'status_labels_json': json.dumps(status_labels),
        'status_data_json': json.dumps(status_data),
        'sub_labels_json': json.dumps(sub_labels),
        'sub_data_json': json.dumps(sub_data),
        'recent_dates_json': json.dumps(recent_dates),
        'recent_posts_json': json.dumps(recent_posts),
        'recent_ai_chats_json': json.dumps(recent_ai_chats),
        'top_platform_names_json': json.dumps(top_platform_names),
        'top_platform_counts_json': json.dumps(top_platform_counts),
    })

    return context