'use client'

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Zap,
  Edit,
  Trash2,
  MoreHorizontal,
  Target,
  MessageCircle,
  Hash,
  Calendar
} from 'lucide-react'
import { RuleForm } from './RuleForm'
import { deleteAutomationRuleAction, toggleAutomationRuleAction, getFacebookPagesAction } from '@/actions'

interface RulesListProps {
  rules: any[]
  loading: boolean
  onRefresh: () => void
}

export function RulesList({ rules, loading, onRefresh }: RulesListProps) {
  const [selectedRule, setSelectedRule] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [facebookPages, setFacebookPages] = useState<any>(null)

  // Load Facebook pages when needed for edit form
  const loadFacebookPages = async () => {
    if (!facebookPages) {
      const result = await getFacebookPagesAction()
      if (!('error' in result)) {
        setFacebookPages(result)
      }
    }
  }

  const handleEdit = async (rule: any) => {
    await loadFacebookPages()
    setSelectedRule(rule)
    setShowEditForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return

    setProcessingId(id)
    try {
      const result = await deleteAutomationRuleAction(id)
      if (!('error' in result)) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleToggle = async (id: number) => {
    setProcessingId(id)
    try {
      const result = await toggleAutomationRuleAction(id)
      if (!('error' in result)) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules</h3>
        <p className="text-gray-600 mb-4">
          Create your first rule to start automating comment replies.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              rule.is_active 
                ? 'bg-green-100' 
                : 'bg-gray-100'
            }`}>
              {rule.is_active ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500" />
              )}
            </div>

            {/* Rule Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {rule.rule_name}
                </h4>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{rule.connection_name}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  rule.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Keywords */}
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3 h-3 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {(rule.keywords || []).slice(0, 3).map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{backgroundColor: '#714efe1a', color: '#714efe'}}
                    >
                      {keyword}
                    </span>
                  ))}
                  {(rule.keywords || []).length > 3 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      +{(rule.keywords || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Reply Preview */}
              <div className="flex items-start gap-2 mb-3">
                <MessageCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 line-clamp-2">
                  {rule.reply_template}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {rule.times_triggered || 0} triggers
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created {formatDate(rule.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Priority {rule.priority || 0}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleToggle(rule.id)}
                disabled={processingId === rule.id}
                className={`p-2 rounded-lg transition-colors ${
                  rule.is_active
                    ? 'hover:bg-red-100 text-red-600'
                    : 'hover:bg-green-100 text-green-600'
                } disabled:opacity-50`}
                title={rule.is_active ? 'Deactivate rule' : 'Activate rule'}
              >
                {rule.is_active ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => handleEdit(rule)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Edit rule"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(rule.id)}
                disabled={processingId === rule.id}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Rule Form Modal */}
      {showEditForm && selectedRule && facebookPages && (
        <RuleForm
          rule={selectedRule}
          facebookPages={facebookPages}
          onClose={() => {
            setShowEditForm(false)
            setSelectedRule(null)
          }}
          onSuccess={() => {
            setShowEditForm(false)
            setSelectedRule(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}