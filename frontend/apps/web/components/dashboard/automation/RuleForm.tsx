'use client'

import { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  Zap,
  Hash,
  MessageCircle,
  Target
} from 'lucide-react'
import { createAutomationRuleAction, updateAutomationRuleAction } from '@/actions'

interface RuleFormProps {
  rule?: any // If provided, we're editing; if not, we're creating
  facebookPages: any
  onClose: () => void
  onSuccess: () => void
}

export function RuleForm({ rule, facebookPages, onClose, onSuccess }: RuleFormProps) {
  const isEditing = !!rule
  const [formData, setFormData] = useState({
    rule_name: rule?.rule_name || '',
    keywords: rule?.keywords || [''],
    reply_template: rule?.reply_template || '',
    is_active: rule?.is_active ?? true,
    priority: rule?.priority || 0,
    connection_id: rule?.connection?.id || ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const pages = facebookPages?.pages || []

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...formData.keywords]
    newKeywords[index] = value
    setFormData(prev => ({ ...prev, keywords: newKeywords }))
  }

  const addKeyword = () => {
    setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ''] }))
  }

  const removeKeyword = (index: number) => {
    if (formData.keywords.length > 1) {
      const newKeywords = formData.keywords.filter((_: any, i: number) => i !== index)
      setFormData(prev => ({ ...prev, keywords: newKeywords }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.rule_name.trim()) {
      newErrors.rule_name = 'Rule name is required'
    }

    if (!formData.connection_id) {
      newErrors.connection_id = 'Please select a Facebook page'
    }

    const validKeywords = formData.keywords.filter((k: any) => k.trim())
    if (validKeywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required'
    }

    if (!formData.reply_template.trim()) {
      newErrors.reply_template = 'Reply template is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // Filter out empty keywords
      const cleanedKeywords = formData.keywords.filter((k: any) => k.trim())

      const submitData = {
        rule_name: formData.rule_name.trim(),
        keywords: cleanedKeywords,
        reply_template: formData.reply_template.trim(),
        is_active: formData.is_active,
        priority: parseInt(formData.priority.toString()) || 0,
        connection_id: parseInt(formData.connection_id)
      }

      let result
      if (isEditing) {
        result = await updateAutomationRuleAction(rule.id, {
          rule_name: submitData.rule_name,
          keywords: submitData.keywords,
          reply_template: submitData.reply_template,
          is_active: submitData.is_active,
          priority: submitData.priority
        })
      } else {
        result = await createAutomationRuleAction(submitData)
      }

      if (!('error' in result)) {
        onSuccess()
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      console.error('Error saving rule:', error)
      setErrors({ submit: 'Failed to save rule' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#bea456]" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Automation Rule' : 'Create Automation Rule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Rule Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.rule_name}
                onChange={(e) => handleInputChange('rule_name', e.target.value)}
                placeholder="e.g., Thank you responses"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
              />
              {errors.rule_name && (
                <p className="text-sm text-red-600 mt-1">{errors.rule_name}</p>
              )}
            </div>

            {/* Facebook Page */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Page *
                </label>
                <select
                  value={formData.connection_id}
                  onChange={(e) => handleInputChange('connection_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
                >
                  <option value="">Select a Facebook page</option>
                  {pages.map((page: any) => (
                    <option key={page.connection_id} value={page.connection_id}>
                      {page.page_name}
                    </option>
                  ))}
                </select>
                {errors.connection_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.connection_id}</p>
                )}
              </div>
            )}

            {/* Keywords */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <label className="block text-sm font-medium text-gray-700">
                  Keywords * (triggers for this rule)
                </label>
              </div>
              <div className="space-y-2">
                {formData.keywords.map((keyword: any, index: any) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleKeywordChange(index, e.target.value)}
                      placeholder="e.g., thank you, thanks, awesome"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
                    />
                    {formData.keywords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyword(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addKeyword}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[#bea456] hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Keyword
                </button>
              </div>
              {errors.keywords && (
                <p className="text-sm text-red-600 mt-1">{errors.keywords}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                The rule will trigger when a comment contains any of these keywords (case-insensitive).
              </p>
            </div>

            {/* Reply Template */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <label className="block text-sm font-medium text-gray-700">
                  Reply Template *
                </label>
              </div>
              <textarea
                value={formData.reply_template}
                onChange={(e) => handleInputChange('reply_template', e.target.value)}
                placeholder="e.g., Thank you so much for your kind words! 🙏 We really appreciate your support!"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent resize-none"
              />
              {errors.reply_template && (
                <p className="text-sm text-red-600 mt-1">{errors.reply_template}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This message will be automatically sent as a reply when the rule is triggered.
              </p>
            </div>

            {/* Priority */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gray-500" />
                <label className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
              </div>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher priority rules (larger numbers) are checked first. Default is 0.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Activate Rule</h4>
                <p className="text-xs text-gray-500">
                  Enable this rule to start automatic comment replies
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bea45666] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bea456]"></div>
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#bea456] text-white rounded-lg hover:bg-[#af9442ff] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {isEditing ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}