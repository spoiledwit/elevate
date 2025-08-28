import { AutomationRulesManager } from '@/components/dashboard/automation/AutomationRulesManager'
import { getAutomationRulesAction, getFacebookPagesAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Message Automation Rules - Elevate Social',
  description: 'Manage automation rules for comments and direct messages'
}

export default async function AutomationRulesPage() {
  // Fetch data server-side
  const [rulesResult, pagesResult] = await Promise.all([
    getAutomationRulesAction(),
    getFacebookPagesAction()
  ])

  const rules = 'error' in rulesResult ? null : rulesResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <AutomationRulesManager 
        initialRules={rules}
        facebookPages={pages}
      />
    </div>
  )
}