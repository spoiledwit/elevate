'use client'

import { useState } from 'react'
import {
  X,
  Settings2,
  Clock,
  MessageSquare,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { createOrUpdateAutomationSettingsAction, subscribePageWebhooksAction } from '@/actions/comment-automation-action'

interface SettingsFormProps {
  setting?: any
  facebookPages: any
  pagesWithoutSettings?: any[]
  onClose: () => void
  onSuccess: () => void
}

export function SettingsForm({ setting, facebookPages, pagesWithoutSettings, onClose, onSuccess }: SettingsFormProps) {
  const isEditing = !!setting
  const [formData, setFormData] = useState({
    connection_id: setting?.connection?.id || (pagesWithoutSettings?.[0]?.connection_id || ''),
    is_enabled: setting?.is_enabled ?? true,
    reply_delay_seconds: setting?.reply_delay_seconds || 5,
    default_reply: setting?.default_reply || ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const pages = facebookPages?.pages || []
  const availablePages = isEditing ? pages : (pagesWithoutSettings || [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.connection_id) {
      newErrors.connection_id = 'Please select a Facebook page'
    }

    if (formData.reply_delay_seconds < 0 || formData.reply_delay_seconds > 300) {
      newErrors.reply_delay_seconds = 'Delay must be between 0 and 300 seconds'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // 1. Create/update automation settings
      const result = await createOrUpdateAutomationSettingsAction(
        parseInt(formData.connection_id),
        {
          is_enabled: formData.is_enabled,
          reply_delay_seconds: parseInt(formData.reply_delay_seconds.toString()),
          default_reply: formData.default_reply.trim() || undefined,
          connection_id: parseInt(formData.connection_id)
        }
      )

      if ('error' in result) {
        setErrors({ submit: result.error })
        return
      }

      // 2. If automation is enabled, subscribe to webhooks
      if (formData.is_enabled && selectedPage) {
        const webhookResult = await subscribePageWebhooksAction(selectedPage.page_id)
        if ('error' in webhookResult) {
          // Webhook failed but settings saved - show warning
          setErrors({ 
            submit: `Settings saved but webhook registration failed: ${webhookResult.error}. You may need to reconnect your Facebook page.` 
          })
          return
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving settings:', error)
      setErrors({ submit: 'Failed to save settings' })
    } finally {
      setLoading(false)
    }
  }

  const selectedPage = availablePages.find((p: any) =>
    p.connection_id.toString() === formData.connection_id.toString()
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Update Settings' : 'Setup Automation'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Page Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Page *
            </label>
            {isEditing ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{setting?.connection_name}</p>
              </div>
            ) : (
              <>
                <select
                  value={formData.connection_id}
                  onChange={(e) => handleInputChange('connection_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a Facebook page</option>
                  {availablePages.map((page: any) => (
                    <option key={page.connection_id} value={page.connection_id}>
                      {page.page_name}
                    </option>
                  ))}
                </select>
                {errors.connection_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.connection_id}</p>
                )}
              </>
            )}
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                {formData.is_enabled ? (
                  <ToggleRight className="w-5 h-5 text-purple-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Auto-reply to comments</h4>
                <p className="text-sm text-gray-600">
                  {formData.is_enabled ? 'Automation is enabled' : 'Automation is disabled'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_enabled}
                onChange={(e) => handleInputChange('is_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Reply Delay */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <label className="block text-sm font-medium text-gray-700">
                Reply Delay (seconds)
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="60"
                value={formData.reply_delay_seconds}
                onChange={(e) => handleInputChange('reply_delay_seconds', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex items-center gap-1 min-w-[60px]">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.reply_delay_seconds}
                  onChange={(e) => handleInputChange('reply_delay_seconds', e.target.value)}
                  className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">s</span>
              </div>
            </div>
            {errors.reply_delay_seconds && (
              <p className="text-sm text-red-600 mt-1">{errors.reply_delay_seconds}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Wait this long before sending automatic replies (0 = instant)
            </p>
          </div>

          {/* Default Reply */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <label className="block text-sm font-medium text-gray-700">
                Default Reply Message
              </label>
            </div>
            <textarea
              value={formData.default_reply}
              onChange={(e) => handleInputChange('default_reply', e.target.value)}
              placeholder="Optional: Message to send when no automation rules match..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message is sent when a comment doesn't match any automation rules
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? 'Updating...' : 'Setting up...'}
                </>
              ) : (
                <>
                  <Settings2 className="w-4 h-4" />
                  {isEditing ? 'Update Settings' : 'Setup Automation'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}