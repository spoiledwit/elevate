import { getPlatformStatusAction } from '@/actions'
import { SocialAccountsManager } from '@/components/dashboard/social-accounts/SocialAccountsManager'

export const dynamic = 'force-dynamic'

interface Platform {
  name: string
  display_name: string
  connected: boolean
  connection_count: number
  connections: Array<{
    id: number
    platform_username?: string
    platform_display_name?: string
    facebook_page_name?: string
    instagram_username?: string
    pinterest_user_id?: string
    is_verified?: boolean
  }>
}

export default async function SocialAccountsPage() {
  // Available platforms to show (even if not in database yet)
  const availablePlatforms = [
    { name: 'facebook', display_name: 'Facebook' },
    { name: 'instagram', display_name: 'Instagram' },
    { name: 'pinterest', display_name: 'Pinterest' },
    { name: 'linkedin', display_name: 'LinkedIn' },
  ]

  // Load platform status on server
  let initialPlatforms: Platform[] = []
  
  try {
    const result = await getPlatformStatusAction()
    
    // Merge API data with available platforms
    initialPlatforms = availablePlatforms.map(availablePlatform => {
      // Find matching platform from API
      const apiPlatform = !('error' in result) 
        ? result.platforms.find(p => p.name === availablePlatform.name)
        : null
      
      return {
        name: availablePlatform.name,
        display_name: availablePlatform.display_name,
        connected: apiPlatform?.connected || false,
        connection_count: apiPlatform?.connection_count || 0,
        connections: apiPlatform?.connections || []
      }
    })
    
  } catch (error) {
    console.error('Failed to load platforms:', error)
    // Show available platforms even if API fails
    initialPlatforms = availablePlatforms.map(p => ({
      ...p,
      connected: false,
      connection_count: 0,
      connections: []
    }))
  }

  return <SocialAccountsManager initialPlatforms={initialPlatforms} />
}