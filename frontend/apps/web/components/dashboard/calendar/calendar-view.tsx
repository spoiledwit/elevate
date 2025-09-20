'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, FileText, Plus, X, Eye } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  platforms: string[]
  scheduledFor: Date | null
  status: 'published' | 'scheduled' | 'draft' | 'failed'
  mediaCount: number
  author: string
  publishedAt?: Date
  metrics?: {
    likes: number
    comments: number
    shares: number
    reach: number
  }
  error?: string
}

interface CalendarViewProps {
  posts: Post[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

const statusConfig = {
  published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  scheduled: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  draft: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
}

export function CalendarView({ posts, selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expandedDate, setExpandedDate] = useState<Date | null>(null)

  // Get the first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days including padding from previous/next month
  const calendarDays = []

  // Previous month padding
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i),
      isCurrentMonth: false
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      isCurrentMonth: true
    })
  }

  // Next month padding to complete the grid (42 total cells = 6 weeks)
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day),
      isCurrentMonth: false
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newMonth
    })
  }

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      let postDate: Date | null = null

      // Determine which date to use based on post status
      switch (post.status) {
        case 'scheduled':
          postDate = post.scheduledFor
          break
        case 'published':
          // Show published posts on their published date, or creation date if no published date
          postDate = post.publishedAt || (post.scheduledFor ? new Date(post.scheduledFor) : new Date())
          break
        case 'draft':
          // Show draft posts on today's date so they're visible
          postDate = new Date()
          break
        case 'failed':
          // Show failed posts on their intended scheduled date or today
          postDate = post.scheduledFor || new Date()
          break
        default:
          postDate = post.scheduledFor || new Date()
      }

      if (!postDate) return false
      return postDate.toDateString() === date.toDateString()
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            const dayPosts = getPostsForDate(date)
            const isSelectedDate = isSelected(date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={index}
                onClick={() => onDateSelect(date)}
                className={cn(
                  "min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm",
                  isCurrentMonth
                    ? "bg-white border-gray-200 hover:border-gray-300"
                    : "bg-gray-50 border-gray-100 text-gray-400",
                  isSelectedDate && "ring-2 ring-brand-500 border-brand-500",
                  isTodayDate && !isSelectedDate && "border-purple-300 bg-purple-50"
                )}
              >
                {/* Date Number */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isTodayDate && "text-brand-600",
                  isSelectedDate && "text-brand-600"
                )}>
                  {date.getDate()}
                </div>

                {/* Posts for this date */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => {
                    const config = statusConfig[post.status]
                    const Icon = config.icon

                    return (
                      <div
                        key={post.id}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium border cursor-pointer hover:shadow-sm transition-all",
                          config.bg,
                          config.border,
                          config.color
                        )}
                        title={post.content.substring(0, 100) + '...'}
                      >
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate flex-1">
                            {post.content.substring(0, 20)}...
                          </span>
                        </div>
                        {post.scheduledFor && (
                          <div className="text-xs opacity-75 mt-0.5">
                            {new Intl.DateTimeFormat('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }).format(post.scheduledFor)}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Show count if more posts exist with expand button */}
                  {dayPosts.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedDate(date)
                      }}
                      className="w-full text-xs text-brand-600 px-2 py-1 hover:bg-purple-50 rounded transition-colors font-medium"
                    >
                      +{dayPosts.length - 3} more
                    </button>
                  )}

                  {/* Add post button for current month dates or expand button if posts exist */}
                  {isCurrentMonth && (
                    dayPosts.length === 0 ? (
                      <button className="w-full p-2 border-2 border-dashed border-gray-200 rounded text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors group">
                        <Plus className="w-4 h-4 mx-auto group-hover:scale-110 transition-transform" />
                      </button>
                    ) : dayPosts.length <= 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedDate(date)
                        }}
                        className="w-full p-1 mt-1 text-xs text-brand-600 hover:bg-purple-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View All
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded Day Modal */}
      {expandedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Posts for {formatDate(expandedDate)}
              </h3>
              <button
                onClick={() => setExpandedDate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {getPostsForDate(expandedDate).map((post) => {
                  const config = statusConfig[post.status]
                  const Icon = config.icon

                  return (
                    <div
                      key={post.id}
                      className={cn(
                        "p-4 rounded-lg border hover:shadow-md transition-all",
                        config.bg,
                        config.border
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-2 leading-relaxed">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="font-medium">{post.author}</span>
                            {post.scheduledFor && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Intl.DateTimeFormat('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }).format(post.scheduledFor)}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{post.platforms.join(', ')}</span>
                            {post.mediaCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{post.mediaCount} media file{post.mediaCount !== 1 ? 's' : ''}</span>
                              </>
                            )}
                          </div>
                          {post.error && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                              {post.error}
                            </div>
                          )}
                          {post.metrics && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="font-medium text-gray-900">{post.metrics.likes}</div>
                                <div className="text-gray-500">Likes</div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="font-medium text-gray-900">{post.metrics.comments}</div>
                                <div className="text-gray-500">Comments</div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="font-medium text-gray-900">{post.metrics.shares}</div>
                                <div className="text-gray-500">Shares</div>
                              </div>
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="font-medium text-gray-900">{post.metrics.reach}</div>
                                <div className="text-gray-500">Reach</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={cn("px-2 py-1 rounded text-xs font-medium", config.bg, config.color)}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {getPostsForDate(expandedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No posts scheduled for this date</p>
                    <Link
                      href="/post-creator"
                      className="text-sm text-brand-600 hover:text-purple-700 font-medium mt-2 inline-block"
                      onClick={() => setExpandedDate(null)}
                    >
                      Schedule a post
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {getPostsForDate(expandedDate).length} post{getPostsForDate(expandedDate).length !== 1 ? 's' : ''} total
                </div>
                <Link
                  href="/post-creator"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
                  onClick={() => setExpandedDate(null)}
                >
                  <Plus className="w-4 h-4" />
                  Create New Post
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Posts for {formatDate(selectedDate)}
          </h3>
          <div className="space-y-2">
            {getPostsForDate(selectedDate).map((post) => {
              const config = statusConfig[post.status]
              const Icon = config.icon

              return (
                <div
                  key={post.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    config.bg,
                    config.border
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{post.author}</span>
                        {post.scheduledFor && (
                          <>
                            <span>•</span>
                            <span>
                              {new Intl.DateTimeFormat('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              }).format(post.scheduledFor)}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{post.platforms.length} platform{post.platforms.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {getPostsForDate(selectedDate).length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No posts scheduled for this date</p>
                <Link
                  href="/post-creator"
                  className="text-sm text-brand-600 hover:text-purple-700 font-medium mt-1">
                  Schedule a post
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}