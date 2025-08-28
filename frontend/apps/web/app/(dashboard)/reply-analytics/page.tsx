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
  // Fetch data server-side
  const [
    commentRepliesResult, 
    commentStatsResult, 
    dmRepliesResult,
    dmStatsResult,
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
  const dmReplies = 'error' in dmRepliesResult ? null : dmRepliesResult
  const dmStats = 'error' in dmStatsResult ? null : dmStatsResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <ReplyAnalyticsManager
        initialCommentReplies={commentReplies}
        initialCommentStats={commentStats}
        initialDMReplies={dmReplies}
        initialDMStats={dmStats}
        facebookPages={pages}
      />
    </div>
  )
}