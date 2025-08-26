import { getPlatformStatusAction } from '@/actions'
import { SocialAccountsManager } from '@/components/dashboard/social-accounts/SocialAccountsManager'

export const dynamic = 'force-dynamic'

interface Platform {
  name: string
  display_name: string
  description?: string
  isComingSoon?: boolean
  connected: boolean
  connection_count: number
  connections: Array<{
    id: number
    platform_username?: string
    platform_display_name?: string
    platform_profile_url?: string
    facebook_page_name?: string
    instagram_username?: string
    pinterest_user_id?: string
    is_verified?: boolean
  }>
}

export default async function SocialAccountsPage() {
  // Available platforms to show (even if not in database yet)
  const availablePlatforms = [
    {
      name: 'facebook',
      display_name: 'Facebook',
      isComingSoon: false
    },
    {
      name: 'instagram',
      display_name: 'Instagram',
      isComingSoon: false
    },
    {
      name: 'pinterest',
      display_name: 'Pinterest',
      isComingSoon: true
    },
    {
      name: 'tiktok',
      display_name: 'TikTok',
      isComingSoon: true
    },
    {
      name: 'youtube',
      display_name: 'YouTube',
      isComingSoon: true
    }
  ]

  // Load platform status on server
  let initialPlatforms: Platform[] = []

  try {
    const result = await getPlatformStatusAction()

    // Merge API data with available platforms
    initialPlatforms = availablePlatforms.map(availablePlatform => {
      const apiPlatform = !('error' in result) 
        ? result.platforms.find(p => p.name === availablePlatform.name)
        : null
      
      return {
        name: availablePlatform.name,
        display_name: availablePlatform.display_name,
        isComingSoon: availablePlatform.isComingSoon,
        connected: apiPlatform ? apiPlatform.connections.length > 0 : false,
        connection_count: apiPlatform ? apiPlatform.connections.length : 0,
        connections: apiPlatform ? apiPlatform.connections : []
      }
    })

  } catch (error) {
    console.error('Failed to load platforms:', error)
    // Show available platforms even if API fails
    initialPlatforms = availablePlatforms.map(p => ({
      name: p.name,
      display_name: p.display_name,
      isComingSoon: p.isComingSoon,
      connected: false,
      connection_count: 0,
      connections: []
    }))
  }

  return <SocialAccountsManager initialPlatforms={initialPlatforms} />
}