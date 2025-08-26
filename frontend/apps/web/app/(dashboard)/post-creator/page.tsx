import { PostCreatorManager } from '@/components/dashboard/post-creator/PostCreatorManager'
import { getPlatformStatusAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Post - Elevate Social',
  description: 'Compose and publish content across multiple social media platforms'
}

interface PlatformConnection {
  id: number
  platform_username?: string
  platform_display_name?: string
  facebook_page_name?: string
  instagram_username?: string
  platform_profile_url?: string
  pinterest_user_id?: string
  is_verified?: boolean
}

interface Platform {
  name: string
  display_name: string
  connected: boolean
  connection_count: number
  connections: PlatformConnection[]
}

export default async function PostCreatorPage() {
  // Fetch platforms data server-side
  const platformResult = await getPlatformStatusAction()
  const platforms: Platform[] = 'error' in platformResult ? [] : (platformResult.platforms || [])

  return <PostCreatorManager initialPlatforms={platforms} />
}