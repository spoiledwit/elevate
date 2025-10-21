'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError,
  type CTABanner,
  type PatchedCTABanner,
  type CustomLinkCreateUpdate,
  type PatchedCustomLinkCreateUpdate,
  type SocialIcon,
  type PatchedSocialIcon,
  type PatchedUserProfile,
  type Order,
  StyleEnum
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Type definitions for storefront actions
export interface CTABannerCreateData {
  text: string
  button_text: string
  style?: string
  button_url: string
  is_active?: boolean
}

export interface CTABannerUpdateData {
  text?: string
  button_text?: string
  button_url?: string
  style?: string
  is_active?: boolean
}

export interface NewProductCreateData {
  order?: number;
  is_active?: boolean;
  type?: string;
  thumbnail?: File | null;
  title?: string;
  subtitle?: string;
  button_text?: string;
  style?: StyleEnum | string;
  checkout_image?: File | null;
  checkout_title?: string;
  checkout_description?: string;
  checkout_bottom_title?: string;
  checkout_cta_button_text?: string;
  checkout_price?: string | null;
  checkout_discounted_price?: string | null;
  additional_info?: any;
  collect_info_fields_data?: Array<{
    field_type: string;
    label: string;
    placeholder?: string;
    is_required: boolean;
    options?: string[];
    order: number;
  }>;
}

export interface CustomLinkUpdateData {
  text?: string
  url?: string
  order?: number
  is_active?: boolean
}

export interface CustomLinkReorderData {
  id: number
  order: number
}

export interface SocialIconCreateData {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'snapchat' | 'pinterest' | 'github' | 'website'
  url: string
  is_active?: boolean
}

export interface SocialIconUpdateData {
  platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'snapchat' | 'pinterest' | 'github' | 'website'
  url?: string
  is_active?: boolean
}

export interface ProfileUpdateData {
  display_name?: string
  bio?: string
  embedded_video?: string
  is_active?: boolean
}

export interface ProfileImageUploadData {
  image: File
}

export interface AnalyticsParams {
  days?: number
  start_date?: string
  end_date?: string
}

export interface OrderCreateData {
  customer_name?: string
  customer_email?: string
  form_responses: { [key: string]: any }
}

// =============================================================================
// PROFILE ACTIONS
// =============================================================================

/**
 * Get all user profiles (admin/list view)
 */
export async function getProfilesAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontProfilesList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get profiles:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch profiles' }
    }
    return { error: 'Failed to fetch profiles' }
  }
}

/**
 * Get current user's profile - creates one if it doesn't exist
 */
export async function getCurrentProfileAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    // First try to get existing profiles for this user
    const profilesResponse = await apiClient.storefront.storefrontProfilesList()
    
    if (profilesResponse.results && profilesResponse.results.length > 0) {
      // User has a profile, return the first one
      return profilesResponse.results[0]
    }
    
    // User doesn't have a profile yet, create one with default values
    const newProfile = await apiClient.storefront.storefrontProfilesCreate({
      display_name: session.user?.name || session.user?.username || 'User',
      bio: '',
      embedded_video: '',
      is_active: true
    } as any)
    
    return newProfile
  } catch (error) {
    console.error('Failed to get/create profile:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch profile' }
    }
    return { error: 'Failed to fetch profile' }
  }
}

/**
 * Get specific profile by ID
 */
export async function getProfileAction(profileId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontProfilesRetrieve(profileId)
    
    return response
  } catch (error) {
    console.error('Failed to get profile:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch profile' }
    }
    return { error: 'Failed to fetch profile' }
  }
}

/**
 * Update profile information
 */
export async function updateProfileAction(data: ProfileUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontProfilesUpdatePartialUpdate(data as PatchedUserProfile)
    
    return response
  } catch (error) {
    console.error('Failed to update profile:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update profile' }
    }
    return { error: 'Failed to update profile' }
  }
}

/**
 * Upload profile image
 */
export async function uploadProfileImageAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    // Extract image from FormData
    const image = formData.get('image') as Blob
    
    const response = await apiClient.storefront.storefrontProfilesUploadImageCreate({
      image
    })
    
    return response
  } catch (error) {
    console.error('Failed to upload profile image:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to upload profile image' }
    }
    return { error: 'Failed to upload profile image' }
  }
}

/**
 * Get public profile by username (for storefront display)
 */
export async function getPublicProfileAction(username: string) {
  try {
    const apiClient = await getApiClient() // No session needed for public endpoint
    const response = await apiClient.storefront.storefrontProfilesPublicRetrieve(username)
    
    return response
  } catch (error) {
    console.error('Failed to get public profile:', error)
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { error: 'Profile not found' }
      }
      return { error: error.body?.error || 'Failed to fetch public profile' }
    }
    return { error: 'Failed to fetch public profile' }
  }
}

/**
 * Track profile view for analytics
 */
export async function trackProfileViewAction(username: string, userAgent?: string, referrer?: string) {
  try {
    const apiClient = await getApiClient() // No session needed for tracking
    const response = await apiClient.storefront.storefrontProfilesTrackViewCreate(username, {
      user_agent: userAgent,
      referrer: referrer
    } as any)
    
    return response
  } catch (error) {
    console.error('Failed to track profile view:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to track profile view' }
    }
    return { error: 'Failed to track profile view' }
  }
}

/**
 * Get profile analytics
 */
export async function getProfileAnalyticsAction(_params?: AnalyticsParams) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontProfilesAnalyticsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get profile analytics:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch profile analytics' }
    }
    return { error: 'Failed to fetch profile analytics' }
  }
}

// =============================================================================
// CUSTOM LINKS ACTIONS
// =============================================================================

/**
 * Get all custom links for the user
 */
export async function getCustomLinksAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontLinksList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get custom links:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch custom links' }
    }
    return { error: 'Failed to fetch custom links' }
  }
}

/**
 * Create FormData for custom link with optional thumbnail
 */
export async function createCustomLinkFormData(data: any, thumbnailFile?: File): Promise<FormData> {
  const formData = new FormData()
  
  formData.append('text', data.text)
  formData.append('url', data.url)
  formData.append('is_active', data.is_active.toString())
  
  if (data.order !== undefined) {
    formData.append('order', data.order.toString())
  }
  
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile)
  }
  
  return formData
}

/**
 * Create a new product/custom link
 */
export async function createNewProductAction(data: NewProductCreateData): Promise<{ data?: CustomLinkCreateUpdate; error?: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontLinksCreate(data as CustomLinkCreateUpdate)
    
    return { data: response }
  } catch (error) {
    console.error('Failed to create new product:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create new product' }
    }
    return { error: 'Failed to create new product' }
  }
}

/**
 * Create a new custom link with FormData (supports file uploads)
 */
export async function createCustomLinkWithFileAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const baseUrl = process.env.API_URL || 'http://api:8000'
    const url = `${baseUrl}/api/storefront/links/`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to create custom link:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create custom link' }
  }
}

/**
 * Get a specific custom link by ID
 */
export async function getCustomLinkAction(linkId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontLinksRetrieve(linkId)
    
    return response
  } catch (error) {
    console.error('Failed to get custom link:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch custom link' }
    }
    return { error: 'Failed to fetch custom link' }
  }
}

/**
 * Update an existing custom link
 */
export async function updateCustomLinkAction(linkId: string, data: CustomLinkUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontLinksPartialUpdate(linkId, data as PatchedCustomLinkCreateUpdate)
    
    return response
  } catch (error) {
    console.error('Failed to update custom link:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update custom link' }
    }
    return { error: 'Failed to update custom link' }
  }
}

/**
 * Update an existing custom link with FormData (supports file uploads)
 */
export async function updateCustomLinkWithFileAction(linkId: string, formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const baseUrl = process.env.API_URL || 'http://api:8000'
    const url = `${baseUrl}/api/storefront/links/${linkId}/`
    
    console.log('Making direct fetch to:', url)
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to update custom link:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update custom link' }
  }
}

/**
 * Delete a custom link
 */
export async function deleteCustomLinkAction(linkId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.storefront.storefrontLinksDestroy(linkId)
    
    return { success: true, message: 'Custom link deleted successfully' }
  } catch (error) {
    console.error('Failed to delete custom link:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete custom link' }
    }
    return { error: 'Failed to delete custom link' }
  }
}

/**
 * Reorder custom links
 */
export async function reorderCustomLinksAction(links: CustomLinkReorderData[], page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    // Use direct HTTP request to avoid the broken mediaType in generated client
    const response = await apiClient.storefront.httpRequest.request({
      method: 'POST',
      url: '/api/storefront/links/reorder/',
      query: page ? { page } : undefined,
      body: links,
      mediaType: 'application/json',
    })
    
    return response
  } catch (error) {
    console.error('Failed to reorder custom links:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to reorder custom links' }
    }
    return { error: 'Failed to reorder custom links' }
  }
}

/**
 * Track link click for analytics
 */
export async function trackLinkClickAction(linkId: string, customLinkId: number, userAgent?: string, referrer?: string) {
  try {
    const apiClient = await getApiClient() // No session needed for tracking
    const response = await apiClient.storefront.storefrontLinksTrackClickCreate(parseInt(linkId), customLinkId, {
      id: customLinkId,
      user_agent: userAgent,
      referrer: referrer
    } as any) // Using any because the generated types may not match exactly
    
    return response
  } catch (error) {
    console.error('Failed to track link click:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to track link click' }
    }
    return { error: 'Failed to track link click' }
  }
}

/**
 * Get analytics for a specific custom link
 */
export async function getCustomLinkAnalyticsAction(linkId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { success: false, error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontLinksAnalyticsRetrieve(linkId)
    
    return { success: true, data: response }
  } catch (error) {
    console.error('Failed to get link analytics:', error)
    if (error instanceof ApiError) {
      return { success: false, error: error.body?.error || 'Failed to get link analytics' }
    }
    return { success: false, error: 'Failed to get link analytics' }
  }
}

// =============================================================================
// SOCIAL ICONS ACTIONS
// =============================================================================

/**
 * Get all social icons for the user
 */
export async function getSocialIconsAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontSocialIconsList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get social icons:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch social icons' }
    }
    return { error: 'Failed to fetch social icons' }
  }
}

/**
 * Create a new social icon
 */
export async function createSocialIconAction(data: SocialIconCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontSocialIconsCreate(data as SocialIcon)
    
    return response
  } catch (error) {
    console.error('Failed to create social icon:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create social icon' }
    }
    return { error: 'Failed to create social icon' }
  }
}

/**
 * Get a specific social icon by ID
 */
export async function getSocialIconAction(iconId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontSocialIconsRetrieve(iconId)
    
    return response
  } catch (error) {
    console.error('Failed to get social icon:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch social icon' }
    }
    return { error: 'Failed to fetch social icon' }
  }
}

/**
 * Update an existing social icon
 */
export async function updateSocialIconAction(iconId: string, data: SocialIconUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontSocialIconsPartialUpdate(iconId, data as PatchedSocialIcon)
    
    return response
  } catch (error) {
    console.error('Failed to update social icon:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update social icon' }
    }
    return { error: 'Failed to update social icon' }
  }
}

/**
 * Delete a social icon
 */
export async function deleteSocialIconAction(iconId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.storefront.storefrontSocialIconsDestroy(iconId)
    
    return { success: true, message: 'Social icon deleted successfully' }
  } catch (error) {
    console.error('Failed to delete social icon:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete social icon' }
    }
    return { error: 'Failed to delete social icon' }
  }
}

// =============================================================================
// CTA BANNER ACTIONS
// =============================================================================

/**
 * Get all CTA banners for the user (typically just one)
 */
export async function getCTABannersAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontCtaBannersList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get CTA banners:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch CTA banners' }
    }
    return { error: 'Failed to fetch CTA banners' }
  }
}

/**
 * Create a new CTA banner
 */
export async function createCTABannerAction(data: CTABannerCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontCtaBannersCreate(data as CTABanner)
    
    return response
  } catch (error) {
    console.error('Failed to create CTA banner:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create CTA banner' }
    }
    return { error: 'Failed to create CTA banner' }
  }
}

/**
 * Get a specific CTA banner by ID
 */
export async function getCTABannerAction(bannerId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontCtaBannersRetrieve(bannerId)
    
    return response
  } catch (error) {
    console.error('Failed to get CTA banner:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch CTA banner' }
    }
    return { error: 'Failed to fetch CTA banner' }
  }
}

/**
 * Update an existing CTA banner
 */
export async function updateCTABannerAction(bannerId: string, data: CTABannerUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontCtaBannersPartialUpdate(bannerId, data as PatchedCTABanner)
    
    return response
  } catch (error) {
    console.error('Failed to update CTA banner:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update CTA banner' }
    }
    return { error: 'Failed to update CTA banner' }
  }
}

/**
 * Delete a CTA banner
 */
export async function deleteCTABannerAction(bannerId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.storefront.storefrontCtaBannersDestroy(bannerId)
    
    return { success: true, message: 'CTA banner deleted successfully' }
  } catch (error) {
    console.error('Failed to delete CTA banner:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete CTA banner' }
    }
    return { error: 'Failed to delete CTA banner' }
  }
}

/**
 * Track CTA banner click for analytics
 */
export async function trackBannerClickAction(bannerId: string) {
  try {
    const apiClient = await getApiClient() // No session needed for tracking
    const response = await apiClient.storefront.storefrontCtaBannersTrackClickCreate(
      parseInt(bannerId), 
      parseInt(bannerId), 
      {} as CTABanner
    )
    
    return response
  } catch (error) {
    console.error('Failed to track banner click:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to track banner click' }
    }
    return { error: 'Failed to track banner click' }
  }
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.storefront.storefrontProfilesDashboardStatsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get dashboard stats:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch dashboard statistics' }
    }
    return { error: 'Failed to fetch dashboard statistics' }
  }
}

// =============================================================================
// ORDER ACTIONS
// =============================================================================

/**
 * Create an order for a digital product
 */
export async function createOrderAction(linkId: string, data: OrderCreateData) {
  try {
    const apiClient = await getApiClient() // No session needed for public order creation
    const response = await apiClient.storefront.storefrontLinksCreateOrderCreate(linkId, data as Order)

    return {
      success: true,
      data: {
        ...response,
        // TypeScript workaround - the backend returns additional fields
        checkout_url: (response as any).checkout_url,
        error: (response as any).error,
        message: (response as any).message
      }
    }
  } catch (error) {
    console.error('Failed to create order:', error)
    if (error instanceof ApiError) {
      return { success: false, error: error.body?.error || 'Failed to create order' }
    }
    return { success: false, error: 'Failed to create order' }
  }
}

/**
 * Create an order with embedded Stripe checkout
 * This returns a client_secret for inline checkout rendering
 */
export async function createOrderEmbeddedAction(linkId: string, data: OrderCreateData) {
  try {
    const apiClient = await getApiClient() // No session needed for public order creation

    // Call the new embedded checkout endpoint
    const response = await apiClient.storefront.httpRequest.request({
      method: 'POST',
      url: `/api/storefront/links/${linkId}/create-order-embedded/`,
      body: data,
      mediaType: 'application/json',
    })

    return {
      success: true,
      data: {
        ...response,
        // TypeScript workaround - the backend returns additional fields
        client_secret: (response as any).client_secret,
        session_id: (response as any).session_id,
        order: (response as any).order,
        error: (response as any).error,
        message: (response as any).message,
        is_free: (response as any).is_free,
        download_access: (response as any).download_access
      }
    }
  } catch (error) {
    console.error('Failed to create embedded order:', error)
    if (error instanceof ApiError) {
      return { success: false, error: error.body?.error || 'Failed to create order' }
    }
    return { success: false, error: 'Failed to create order' }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Helper function to create FormData for profile image upload
 */
export async function createProfileImageFormData(file: File): Promise<FormData> {
  const formData = new FormData()
  formData.append('image', file)
  
  return formData
}

// Note: Helper functions moved to utils to avoid server action restrictions