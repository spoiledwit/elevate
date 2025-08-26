import { CommentsManager } from '@/components/dashboard/comments/CommentsManager'
import { getCommentsAction, getFacebookPagesAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comments - Elevate Social'
}

export default async function CommentsPage() {
  // Fetch data server-side
  const [commentsResult, pagesResult] = await Promise.all([
    getCommentsAction(),
    getFacebookPagesAction()
  ])

  const comments = 'error' in commentsResult ? null : commentsResult
  const pages = 'error' in pagesResult ? null : pagesResult

  return (
    <div className="flex-1 bg-gray-50">
      <CommentsManager
        initialComments={comments}
        facebookPages={pages}
      />
    </div>
  )
}