'use client'

import { useState } from 'react'
import {
  Settings2,
  RefreshCw,
  Plus
} from 'lucide-react'
import { SettingsList } from './SettingsList'
import { SettingsForm } from './SettingsForm'
import { SettingsStats } from './SettingsStats'
import { getAutomationSettingsAction } from '@/actions/comment-automation-action'

interface AutomationSettingsManagerProps {
  initialSettings: any
  facebookPages: any
}

export function AutomationSettingsManager({ initialSettings, facebookPages }: AutomationSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Refresh settings
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await getAutomationSettingsAction()
      if (!('error' in result)) {
        setSettings(result)
      }
    } catch (error) {
      console.error('Error refreshing settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const pages = facebookPages?.pages || []
  const settingsList = settings?.results || []

  // Find pages without settings
  const pagesWithoutSettings = pages.filter((page: any) =>
    !settingsList.some((setting: any) =>
      setting.connection?.id === page.connection_id
    )
  )

  const getSettingsStats = () => {
    const enabledCount = settingsList.filter((s: any) => s.is_enabled).length
    const disabledCount = settingsList.filter((s: any) => !s.is_enabled).length
    const avgDelay = settingsList.length > 0
      ? settingsList.reduce((sum: number, s: any) => sum + (s.reply_delay_seconds || 0), 0) / settingsList.length
      : 0
    const withDefaultReply = settingsList.filter((s: any) => s.default_reply?.trim()).length

    return {
      total: settingsList.length,
      enabled: enabledCount,
      disabled: disabledCount,
      avgDelay: Math.round(avgDelay),
      withDefaultReply
    }
  }

  const stats = getSettingsStats()

  return (
    <div className="flex-1 bg-gray-50">
      {/* Simple Header - No complex search/filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Settings2 className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Automation Settings</h1>
                  <p className="text-gray-600">
                    Simple on/off controls for each Facebook page
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {pagesWithoutSettings.length > 0 && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Setup Page
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <SettingsStats stats={stats} />

          {/* Settings List - Simple and Clean */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Page Settings ({settingsList.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Quick automation settings for your Facebook pages
                  </p>
                </div>
              </div>

              <SettingsList
                settings={settingsList}
                loading={loading}
                onRefresh={handleRefresh}
                facebookPages={facebookPages}
              />


            </div>
          </div>
        </div>
      </div>

      {/* Create Settings Form Modal */}
      {showCreateForm && (
        <SettingsForm
          facebookPages={facebookPages}
          pagesWithoutSettings={pagesWithoutSettings}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}