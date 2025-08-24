import type { SocialIconCreateData } from '@/actions/storefront-action'

/**
 * Helper function to validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Helper function to validate social platform
 */
export function validateSocialPlatform(platform: string): platform is SocialIconCreateData['platform'] {
  const validPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'pinterest', 'github', 'website']
  return validPlatforms.includes(platform)
}