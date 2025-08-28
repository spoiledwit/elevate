'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError,
  type PatchedCommentAutomationRule,
  type AutomationRuleCreate,
  MessageTypeEnum,
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
  enable_dm_automation?: boolean
  dm_reply_delay_seconds?: number
  dm_default_reply?: string
}

export interface CommentAutomationSettingsUpdateData {
  is_enabled?: boolean
  default_reply?: string
  reply_delay_seconds?: number
  enable_dm_automation?: boolean
  dm_reply_delay_seconds?: number
  dm_default_reply?: string
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
// DIRECT MESSAGE TYPE DEFINITIONS
// =============================================================================

export interface DirectMessageFilters {
  connection_id?: number
  platform?: 'facebook' | 'instagram'
  status?: 'new' | 'replied' | 'ignored' | 'error'
  page?: number
}

export interface DMReplyData {
  message_id: string
  message: string
  connection_id: number
}

export interface DMAutomationRuleCreateData {
  rule_name: string
  message_type: MessageTypeEnum.DM | MessageTypeEnum.BOTH
  keywords: string[]
  reply_template: string
  is_active?: boolean
  priority?: number
  connection_id: number
}

export interface DMAutomationRuleUpdateData {
  rule_name?: string
  message_type?: MessageTypeEnum.DM | MessageTypeEnum.BOTH
  keywords?: string[]
  reply_template?: string
  is_active?: boolean
  priority?: number
}

export interface DMReplyFilters {
  connection_id?: number
  platform?: 'facebook' | 'instagram'
  status?: 'pending' | 'sent' | 'failed' | 'error'
  page?: number
}

export interface AutomationSettingsUpdateData {
  // Comment automation settings
  is_enabled?: boolean
  default_reply?: string
  reply_delay_seconds?: number
  // DM automation settings
  enable_dm_automation?: boolean
  dm_default_reply?: string
  dm_reply_delay_seconds?: number
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
export async function createAutomationRuleAction(data: CommentAutomationRuleCreateData | DMAutomationRuleCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    const requestData: AutomationRuleCreate = {
      rule_name: data.rule_name,
      message_type: 'message_type' in data ? data.message_type : MessageTypeEnum.COMMENT,
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
export async function createOrUpdateAutomationSettingsAction(connectionId: number, data: CommentAutomationSettingsCreateData | AutomationSettingsUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    
    // Extract connection_id from data if present, otherwise use connectionId parameter
    const { connection_id, ...requestBody } = data as any
    const actualConnectionId = connection_id || connectionId
    
    const response = await apiClient.automationSettings.automationSettingsCreate(actualConnectionId, requestBody)
    
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
export async function updateAutomationSettingsAction(settingId: number, data: AutomationSettingsUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.automationSettings.automationSettingsUpdatePartialUpdate(settingId, data)
    
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
    const response = await apiClient.comments.commentsReplyCreate({
      comment_id: commentId,
      message: message,
      page_id: pageId
    })
    
    return response
  } catch (error) {
    console.error('Error replying to comment:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to reply to comment' }
  }
}

// =============================================================================
// DIRECT MESSAGE ACTIONS
// =============================================================================

/**
 * Get all direct messages for user's Facebook/Instagram connections
 */
export async function getDirectMessagesAction(filters?: DirectMessageFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.directMessages.directMessagesList(filters?.page)
    
    return response
  } catch (error) {
    console.error('Error fetching direct messages:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch direct messages' }
  }
}

/**
 * Get a specific direct message by ID
 */
export async function getDirectMessageAction(id: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.directMessages.directMessagesRetrieve(id)
    
    return response
  } catch (error) {
    console.error('Error fetching direct message:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch direct message' }
  }
}

/**
 * Reply to a Facebook/Instagram direct message manually
 */
export async function replyToDirectMessageAction(data: DMReplyData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.directMessages.directMessagesReplyCreate({
      message_id: data.message_id,
      message: data.message,
      connection_id: data.connection_id
    })
    
    return response
  } catch (error) {
    console.error('Error replying to direct message:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to reply to direct message' }
  }
}

/**
 * Get replies for a specific direct message
 */
export async function getDMRepliesForMessageAction(messageId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.directMessages.directMessagesRepliesRetrieve(messageId)
    
    return response
  } catch (error) {
    console.error('Error fetching DM replies:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch DM replies' }
  }
}

// Note: DM automation rules are now unified with comment automation rules
// Use getAutomationRulesAction() and createAutomationRuleAction() with appropriate message_type

// =============================================================================
// DM REPLY ACTIONS
// =============================================================================

/**
 * Get all DM replies for user's messages
 */
export async function getDMRepliesAction(filters?: DMReplyFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.dmReplies.dmRepliesList(filters?.page)
    
    return response
  } catch (error) {
    console.error('Error fetching DM replies:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch DM replies' }
  }
}

// =============================================================================
// DM AUTOMATION STATS ACTIONS
// =============================================================================

/**
 * Get DM automation statistics
 */
export async function getDMAutomationStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.dmAutomationStats.dmAutomationStatsRetrieve()
    
    return response
  } catch (error) {
    console.error('Error fetching DM automation stats:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch DM automation stats' }
  }
}