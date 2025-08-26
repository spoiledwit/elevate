'use client'

import { useState } from 'react'
import {
  Settings2,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { SettingsForm } from './SettingsForm'
import { deleteAutomationSettingsAction, toggleAutomationSettingsAction } from '@/actions/comment-automation-action'

interface SettingsListProps {
  settings: any[]
  loading: boolean
  onRefresh: () => void
  facebookPages: any
}

export function SettingsList({ settings, loading, onRefresh, facebookPages }: SettingsListProps) {
  const [selectedSetting, setSelectedSetting] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleEdit = (setting: any) => {
    setSelectedSetting(setting)
    setShowEditForm(true)
  }

  const handleToggle = async (setting: any) => {
    setProcessingId(setting.id)
    try {
      const result = await toggleAutomationSettingsAction(setting.id)
      if (!('error' in result)) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error toggling setting:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this automation setting?')) return

    setProcessingId(id)
    try {
      const result = await deleteAutomationSettingsAction(id)
      if (!('error' in result)) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!settings || settings.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pages configured</h3>
        <p className="text-gray-600 mb-4">
          Set up automation for your Facebook pages to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Page Info */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                setting.is_enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Settings2 className={`w-5 h-5 ${
                  setting.is_enabled ? 'text-green-600' : 'text-gray-500'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {setting.connection_name || 'Unknown Page'}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {setting.reply_delay_seconds || 0}s delay
                  </div>
                  {setting.default_reply && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Has default reply
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              setting.is_enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {setting.is_enabled ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Disabled
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Quick Toggle */}
              <button
                onClick={() => handleToggle(setting)}
                disabled={processingId === setting.id}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  setting.is_enabled
                    ? 'hover:bg-red-100 text-red-600'
                    : 'hover:bg-green-100 text-green-600'
                }`}
                title={setting.is_enabled ? 'Disable automation' : 'Enable automation'}
              >
                {processingId === setting.id ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                ) : setting.is_enabled ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
              </button>

              {/* Edit Button */}
              <button
                onClick={() => handleEdit(setting)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Edit settings"
              >
                <Edit className="w-4 h-4" />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(setting.id)}
                disabled={processingId === setting.id}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete settings"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Settings Form Modal */}
      {showEditForm && selectedSetting && (
        <SettingsForm
          setting={selectedSetting}
          facebookPages={facebookPages}
          onClose={() => {
            setShowEditForm(false)
            setSelectedSetting(null)
          }}
          onSuccess={() => {
            setShowEditForm(false)
            setSelectedSetting(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}