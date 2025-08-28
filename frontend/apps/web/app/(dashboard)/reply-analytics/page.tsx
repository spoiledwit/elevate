import { ReplyAnalyticsManager } from '@/components/dashboard/automation/ReplyAnalyticsManager'
import {
  getCommentRepliesListAction,
  getAutomationStatsAction,
  getDMRepliesAction,
  getDMAutomationStatsAction,
  getFacebookPagesAction
} from '@/actions/comment-automation-action'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Message Reply Analytics - Elevate Social',
  description: 'Analytics for comment and direct message automation replies'
}

export default async function ReplyAnalyticsPage() {
  const [
    commentRepliesResult,
    commentStatsResult,
    pagesResult
  ] = await Promise.all([
    getCommentRepliesListAction(),
    getAutomationStatsAction(),
    getDMRepliesAction(),
    getDMAutomationStatsAction(),
    getFacebookPagesAction()
  ])

  const commentReplies = 'error' in commentRepliesResult ? null : commentRepliesResult
  const commentStats = 'error' in commentStatsResult ? null : commentStatsResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <ReplyAnalyticsManager
        initialReplies={commentReplies}
        initialStats={commentStats}
        facebookPages={pages}
      />
    </div>
  )
}