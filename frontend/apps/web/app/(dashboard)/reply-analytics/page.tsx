import { ReplyAnalyticsManager } from '@/components/dashboard/automation/ReplyAnalyticsManager'
import { getCommentRepliesListAction, getAutomationStatsAction, getFacebookPagesAction } from '@/actions/comment-automation-action'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reply Analytics - Elevate Social'
}

export default async function ReplyAnalyticsPage() {
  // Fetch data server-side
  const [repliesResult, statsResult, pagesResult] = await Promise.all([
    getCommentRepliesListAction(),
    getAutomationStatsAction(),
    getFacebookPagesAction()
  ])

  const replies = 'error' in repliesResult ? null : repliesResult
  const stats = 'error' in statsResult ? null : statsResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <ReplyAnalyticsManager
        initialReplies={replies}
        initialStats={stats}
        facebookPages={pages}
      />
    </div>
  )
}