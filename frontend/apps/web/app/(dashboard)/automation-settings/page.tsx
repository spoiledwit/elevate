import { AutomationSettingsManager } from '@/components/dashboard/automation/AutomationSettingsManager'
import { getAutomationSettingsAction, getFacebookPagesAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Automation Settings - Elevate Social'
}

export default async function AutomationSettingsPage() {
  // Fetch data server-side
  const [settingsResult, pagesResult] = await Promise.all([
    getAutomationSettingsAction(),
    getFacebookPagesAction()
  ])

  const settings = 'error' in settingsResult ? null : settingsResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <AutomationSettingsManager
        initialSettings={settings}
        facebookPages={pages}
      />
    </div>
  )
}