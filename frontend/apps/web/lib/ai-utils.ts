/**
 * Client-side utility functions for working with AI responses
 */

/**
 * Convert base64 image to blob for display
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Create download URL for generated image
 */
export function createImageDownloadUrl(base64: string): string {
  const blob = base64ToBlob(base64)
  return URL.createObjectURL(blob)
}

/**
 * Format usage statistics for display
 */
export function formatUsageStats(usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): string {
  if (!usage) return 'No usage data'
  
  return `Tokens used: ${usage.total_tokens || 0} (${usage.prompt_tokens || 0} prompt + ${usage.completion_tokens || 0} completion)`
}

/**
 * Platform-specific content guidelines
 */
export const PLATFORM_GUIDELINES = {
  twitter: {
    maxLength: 280,
    description: 'Short, engaging tweets with hashtags'
  },
  facebook: {
    maxLength: 2000,
    description: 'Engaging posts that encourage interaction'
  },
  instagram: {
    maxLength: 2200,
    description: 'Visual-focused content with engaging captions'
  },
  linkedin: {
    maxLength: 3000,
    description: 'Professional content for business networking'
  },
  tiktok: {
    maxLength: 300,
    description: 'Fun, trendy content for video descriptions'
  },
  youtube: {
    maxLength: 5000,
    description: 'Compelling descriptions for video content'
  },
  pinterest: {
    maxLength: 500,
    description: 'Descriptive content for visual pins'
  }
} as const

/**
 * Content improvement types with descriptions
 */
export const IMPROVEMENT_TYPES = {
  grammar: 'Fix grammar, spelling, and punctuation errors',
  clarity: 'Improve clarity and readability',
  engagement: 'Make content more engaging and compelling',
  tone: 'Adjust tone to be more professional',
  concise: 'Make content more concise and to-the-point'
} as const