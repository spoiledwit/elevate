'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError,
  type Comment,
  type CommentAutomationRule,
  type CommentAutomationRuleCreate,
  type CommentAutomationSettings,
  type CommentReplyList,
  type PatchedCommentAutomationRule
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Type definitions for comment automation actions
export interface CommentAutomationRuleCreateData {
  rule_name: string
  keywords: string[]
  reply_template: string
  is_active?: boolean
  priority?: number
  connection_id: number
}

export interface CommentAutomationRuleUpdateData {
  rule_name?: string
  keywords?: string[]
  reply_template?: string
  is_active?: boolean
  priority?: number
}

export interface CommentAutomationSettingsCreateData {
  is_enabled?: boolean
  default_reply?: string
  reply_delay_seconds?: number
  connection_id: number
}

export interface CommentAutomationSettingsUpdateData {
  is_enabled?: boolean
  default_reply?: string
  reply_delay_seconds?: number
}

export interface CommentFilters {
  connection_id?: number
  status?: 'new' | 'replied' | 'ignored' | 'error'
  page?: number
}

export interface AutomationRuleFilters {
  connection_id?: number
  page?: number
}

export interface CommentReplyFilters {
  connection_id?: number
  status?: 'pending' | 'sent' | 'failed'
  page?: number
}

// =============================================================================
// COMMENT ACTIONS
// =============================================================================

/**
 * Get all comments for user's Facebook connections
 */
export async function getCommentsAction(filters?: CommentFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsList(filters?.page)
    
    return response
  } catch (error) {
    console.error('Error fetching comments:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch comments' }
  }
}

/**
 * Get a specific comment by ID
 */
export async function getCommentAction(id: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsRetrieve(id)
    
    return response
  } catch (error) {
    console.error('Error fetching comment:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch comment' }
  }
}

/**
 * Get replies for a specific comment
 */
export async function getCommentRepliesAction(commentId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsRepliesRetrieve(commentId)
    
    return response
  } catch (error) {
    console.error('Error fetching comment replies:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch comment replies' }
  }
}

// =============================================================================
// AUTOMATION RULE ACTIONS
// =============================================================================

/**
 * Get all automation rules for user's Facebook connections
 */
export async function getAutomationRulesAction(filters?: AutomationRuleFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationRules.automationRulesList(filters?.page)
    
    return response
  } catch (error) {
    console.error('Error fetching automation rules:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch automation rules' }
  }
}

/**
 * Create a new automation rule
 */
export async function createAutomationRuleAction(data: CommentAutomationRuleCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    const requestData: CommentAutomationRuleCreate = {
      rule_name: data.rule_name,
      keywords: data.keywords,
      reply_template: data.reply_template,
      is_active: data.is_active ?? true,
      priority: data.priority ?? 0,
      connection_id: data.connection_id
    }
    
    const response = await apiClient.automationRules.automationRulesCreate(requestData)
    
    return response
  } catch (error) {
    console.error('Error creating automation rule:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to create automation rule' }
  }
}

/**
 * Get a specific automation rule by ID
 */
export async function getAutomationRuleAction(id: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationRules.automationRulesRetrieve(id)
    
    return response
  } catch (error) {
    console.error('Error fetching automation rule:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch automation rule' }
  }
}

/**
 * Update an existing automation rule
 */
export async function updateAutomationRuleAction(id: number, data: CommentAutomationRuleUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    const requestData: PatchedCommentAutomationRule = {
      rule_name: data.rule_name,
      keywords: data.keywords,
      reply_template: data.reply_template,
      is_active: data.is_active,
      priority: data.priority
    }
    
    const response = await apiClient.automationRules.automationRulesPartialUpdate(id, requestData)
    
    return response
  } catch (error) {
    console.error('Error updating automation rule:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to update automation rule' }
  }
}

/**
 * Delete an automation rule
 */
export async function deleteAutomationRuleAction(id: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.automationRules.automationRulesDestroy(id)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting automation rule:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to delete automation rule' }
  }
}

/**
 * Toggle automation rule active/inactive status
 */
export async function toggleAutomationRuleAction(id: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationRules.automationRulesToggleCreate(id)
    
    return response
  } catch (error) {
    console.error('Error toggling automation rule:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to toggle automation rule' }
  }
}

// =============================================================================
// AUTOMATION SETTINGS ACTIONS
// =============================================================================

/**
 * Get all automation settings for user's Facebook connections
 */
export async function getAutomationSettingsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsList()
    
    return response
  } catch (error) {
    console.error('Error fetching automation settings:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch automation settings' }
  }
}

/**
 * Get automation settings for a specific connection
 */
export async function getAutomationSettingsByConnectionAction(connectionId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsRetrieve(connectionId)
    
    return response
  } catch (error) {
    console.error('Error fetching automation settings by connection:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch automation settings' }
  }
}

/**
 * Create or update automation settings for a specific connection
 */
export async function createOrUpdateAutomationSettingsAction(connectionId: number, data: CommentAutomationSettingsCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsCreate(connectionId)
    
    return response
  } catch (error) {
    console.error('Error creating/updating automation settings:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to create/update automation settings' }
  }
}

/**
 * Update automation settings for a specific setting ID
 */
export async function updateAutomationSettingsAction(settingId: number, data: any) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsUpdatePartialUpdate(settingId)
    
    return response
  } catch (error) {
    console.error('Error updating automation settings:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to update automation settings' }
  }
}

/**
 * Delete automation settings
 */
export async function deleteAutomationSettingsAction(settingId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.automationSettings.automationSettingsDeleteDestroy(settingId)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting automation settings:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to delete automation settings' }
  }
}

/**
 * Toggle automation settings enabled/disabled status
 */
export async function toggleAutomationSettingsAction(settingId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsToggleCreate(settingId)
    
    return response
  } catch (error) {
    console.error('Error toggling automation settings:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to toggle automation settings' }
  }
}

// =============================================================================
// COMMENT REPLY ACTIONS
// =============================================================================

/**
 * Get all comment replies for user's comments
 */
export async function getCommentRepliesListAction(filters?: CommentReplyFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.commentReplies.commentRepliesList(filters?.page)
    
    return response
  } catch (error) {
    console.error('Error fetching comment replies:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch comment replies' }
  }
}

// =============================================================================
// ANALYTICS ACTIONS
// =============================================================================

/**
 * Get automation statistics
 */
export async function getAutomationStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationStats.automationStatsRetrieve()
    
    return response
  } catch (error) {
    console.error('Error fetching automation stats:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch automation stats' }
  }
}

// =============================================================================
// FACEBOOK PAGE ACTIONS
// =============================================================================

/**
 * Get Facebook pages connected by the user
 */
export async function getFacebookPagesAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsPagesRetrieve()
    
    return response
  } catch (error) {
    console.error('Error fetching Facebook pages:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch Facebook pages' }
  }
}

/**
 * Subscribe a Facebook page to webhooks
 */
export async function subscribePageWebhooksAction(pageId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsSubscribeWebhooksCreate({
      page_id: pageId
    })
    
    return response
  } catch (error) {
    console.error('Error subscribing page to webhooks:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to subscribe page to webhooks' }
  }
}

/**
 * Reply to a Facebook comment manually
 */
export async function replyToCommentAction(commentId: string, message: string, pageId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.comments.commentsReplyCreate()
    
    return response
  } catch (error) {
    console.error('Error replying to comment:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to reply to comment' }
  }
}