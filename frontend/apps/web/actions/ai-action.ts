'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Types for AI actions
export interface TextGenerationRequest {
  prompt: string
  model?: string
  max_tokens?: number
  temperature?: number
  system_message?: string
}

export interface TextGenerationResponse {
  success: boolean
  text?: string
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

export interface ImageGenerationRequest {
  prompt: string
  model?: 'dall-e-2' | 'dall-e-3'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  n?: number
  style?: 'vivid' | 'natural'
  save_to_media?: boolean
}

export interface ImageGenerationResponse {
  success: boolean
  images?: Array<{
    b64_json: string
    revised_prompt?: string
    url?: string
  }>
  model?: string
  prompt?: string
  error?: string
}

export interface SocialContentRequest {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest'
  topic: string
  tone?: 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational'
  max_length?: number
  include_hashtags?: boolean
}

export interface SocialContentResponse {
  success: boolean
  text?: string
  model?: string
  usage?: Record<string, any>
  error?: string
}

export interface ContentImprovementRequest {
  content: string
  improvement_type?: 'grammar' | 'clarity' | 'engagement' | 'tone' | 'concise'
  target_audience?: string
}

export interface ContentImprovementResponse {
  success: boolean
  text?: string
  model?: string
  usage?: Record<string, any>
  error?: string
}

export interface ImageAnalysisRequest {
  image: File | Blob
  prompt?: string
  model?: string
  max_tokens?: number
  detail?: 'low' | 'high' | 'auto'
}

export interface ImageAnalysisResponse {
  success: boolean
  analysis?: string
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

// Server Actions

/**
 * Generate text using OpenAI's language models
 */
export async function generateTextAction(
  data: TextGenerationRequest
): Promise<TextGenerationResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const apiClient = await getApiClient(session)
    const result = await apiClient.ai.generateText({
      prompt: data.prompt,
      model: data.model,
      max_tokens: data.max_tokens,
      temperature: data.temperature,
      system_message: data.system_message
    })

    return result as TextGenerationResponse
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.body?.error || 'Failed to generate text'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Generate images using OpenAI's DALL-E models
 */
export async function generateImageAction(
  data: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const apiClient = await getApiClient(session)
    const result = await apiClient.ai.generateImage({
      prompt: data.prompt,
      model: data.model,
      size: data.size,
      quality: data.quality,
      n: data.n,
      style: data.style,
      save_to_media: data.save_to_media
    })

    return result as ImageGenerationResponse
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.body?.error || 'Failed to generate image'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Generate platform-specific social media content
 */
export async function generateSocialContentAction(
  data: SocialContentRequest
): Promise<SocialContentResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const apiClient = await getApiClient(session)
    const result = await apiClient.ai.generateSocialContent({
      platform: data.platform,
      topic: data.topic,
      tone: data.tone,
      max_length: data.max_length,
      include_hashtags: data.include_hashtags
    })

    return result as SocialContentResponse
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.body?.error || 'Failed to generate social content'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Improve existing content using AI
 */
export async function improveContentAction(
  data: ContentImprovementRequest
): Promise<ContentImprovementResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const apiClient = await getApiClient(session)
    const result = await apiClient.ai.improveContent({
      content: data.content,
      improvement_type: data.improvement_type,
      target_audience: data.target_audience
    })

    return result as ContentImprovementResponse
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.body?.error || 'Failed to improve content'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Analyze images using OpenAI's vision capabilities
 */
export async function analyzeImageAction(
  data: ImageAnalysisRequest
): Promise<ImageAnalysisResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    const apiClient = await getApiClient(session)
    const result = await apiClient.ai.analyzeImage({
      image: data.image,
      prompt: data.prompt,
      model: data.model,
      max_tokens: data.max_tokens,
      detail: data.detail
    })

    return result as ImageAnalysisResponse
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.body?.error || 'Failed to analyze image'
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Generate streaming text using OpenAI (for real-time responses)
 * Note: This returns a promise that resolves to the streaming URL/endpoint
 */
export async function generateStreamingTextAction(
  requestData: TextGenerationRequest
): Promise<{ success: boolean; streamUrl?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // For streaming, we return the endpoint URL that the client can connect to
    const baseUrl = process.env.API_URL || 'http://localhost:8000'
    const streamUrl = `${baseUrl}/api/ai/generate-text-stream/`
    
    return {
      success: true,
      streamUrl
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to setup streaming'
    }
  }
}