'use client'


interface DashboardStats {
  profile?: {
    id?: number
    username?: string
    display_name?: string
    total_views?: number
    is_active?: boolean
  }
  analytics?: {
    period_days?: number
    profile_views?: number
    recent_views?: number
    total_link_clicks?: number
    recent_link_clicks?: number
    banner_clicks?: number
    recent_banner_clicks?: number
  }
  components?: {
    custom_links?: {
      total?: number
      active?: number
      top_performing?: Array<{
        id: number
        text: string
        url: string
        click_count: number
        order: number
      }>
    }
    cta_banner?: {
      exists?: boolean
      active?: boolean
      clicks?: number
    }
    social_icons?: {
      total?: number
      active?: number
    }
  }
  daily_breakdown?: Array<{
    date: string
    views: number
    clicks: number
  }>
}

interface AnalyticsOverviewProps {
  initialStats: DashboardStats | null
}

export function AnalyticsOverview({ initialStats }: AnalyticsOverviewProps) {
  const stats = initialStats || {}

  const profileViews = stats.analytics?.profile_views || 0
  const recentViews = stats.analytics?.recent_views || 0
  const totalLinkClicks = stats.analytics?.total_link_clicks || 0
  const recentLinkClicks = stats.analytics?.recent_link_clicks || 0
  const bannerClicks = stats.analytics?.banner_clicks || 0
  const recentBannerClicks = stats.analytics?.recent_banner_clicks || 0
  const totalClicks = totalLinkClicks + bannerClicks

  const customLinksTotal = stats.components?.custom_links?.total || 0
  const customLinksActive = stats.components?.custom_links?.active || 0
  const socialIconsTotal = stats.components?.social_icons?.total || 0
  const socialIconsActive = stats.components?.social_icons?.active || 0
  const bannerExists = stats.components?.cta_banner?.exists || false
  const bannerActive = stats.components?.cta_banner?.active || false

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h2>
      
      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Views</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{profileViews.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-green-600">+{recentViews}</span>
            <span>last 30 days</span>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Link Clicks</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalLinkClicks.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-green-600">+{recentLinkClicks}</span>
            <span>last 30 days</span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Banner Clicks</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{bannerClicks.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-green-600">+{recentBannerClicks}</span>
            <span>last 30 days</span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Total Clicks</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalClicks.toLocaleString()}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-green-600">+{(recentLinkClicks + recentBannerClicks)}</span>
            <span>last 30 days</span>
          </div>
        </div>
      </div>

      {/* Component stats */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-gray-900 mb-4">Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Custom Links</span>
              <span className="text-xs text-gray-500">{customLinksActive}/{customLinksTotal} active</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{customLinksTotal}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">CTA Banner</span>
              <span className={`text-xs px-2 py-1 rounded-full ${bannerActive ? 'bg-green-100 text-green-800' : bannerExists ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {bannerActive ? 'Active' : bannerExists ? 'Inactive' : 'None'}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900">{bannerClicks} clicks</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Social Icons</span>
              <span className="text-xs text-gray-500">{socialIconsActive}/{socialIconsTotal} active</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{socialIconsTotal}</div>
          </div>
        </div>
      </div>

      {/* Top performing links */}
      {stats.components?.custom_links?.top_performing && stats.components.custom_links.top_performing.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Top Performing Links</h3>
          <div className="space-y-3">
            {stats.components.custom_links.top_performing.slice(0, 3).map((link, index) => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{link.text}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{link.url}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{link.click_count}</div>
                  <div className="text-xs text-gray-500">clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

