'use client'

import { useState } from 'react'
import { MoreHorizontal, Download, Share2, Trash2, Tag, Clock, FolderOpen, Check, Image, Video, FileText, Archive } from 'lucide-react'
import { cn, formatDate, formatCompactNumber } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'archive'
  size: number
  dimensions?: { width: number; height: number }
  duration?: number
  url: string
  thumbnail: string
  uploadedAt: Date
  tags: string[]
  usedIn: string[]
  folder: string
}

interface MediaGridProps {
  items: MediaItem[]
  viewMode: 'grid' | 'list'
  selectedItems: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return Image
    case 'video':
      return Video
    case 'document':
      return FileText
    case 'archive':
      return Archive
    default:
      return FileText
  }
}

const getFileTypeColor = (type: string) => {
  switch (type) {
    case 'image':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'video':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'document':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'archive':
      return 'text-[#bea456] bg-[#bea4561a] border-[#bea45633]'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function MediaGrid({ items, viewMode, selectedItems, onSelectionChange }: MediaGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const router = useRouter()

  const toggleSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId))
    } else {
      onSelectionChange([...selectedItems, itemId])
    }
  }

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(item => item.id))
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedItems.length === items.length && items.length > 0}
              onChange={selectAll}
              className="rounded border-gray-300 text-[#bea456] focus:ring-[#bea456]"
            />
          </div>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Modified</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => {
            const TypeIcon = getFileTypeIcon(item.type)
            const isSelected = selectedItems.includes(item.id)

            return (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors",
                  isSelected && "bg-[#bea4561a]"
                )}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(item.id)}
                    className="rounded border-gray-300 text-[#bea456] focus:ring-[#bea456]"
                  />
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className={cn("absolute -bottom-1 -right-1 p-1 rounded border", getFileTypeColor(item.type))}>
                      <TypeIcon className="w-3 h-3" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.folder}</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded border", getFileTypeColor(item.type))}>
                    {item.type.toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {formatFileSize(item.size)}
                  {item.dimensions && (
                    <span className="ml-2 text-gray-400">
                      {item.dimensions.width}×{item.dimensions.height}
                    </span>
                  )}
                  {item.duration && (
                    <span className="ml-2 text-gray-400">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {formatDate(item.uploadedAt)}
                </div>

                <div className="col-span-1 flex items-center">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const TypeIcon = getFileTypeIcon(item.type)
        const isSelected = selectedItems.includes(item.id)
        const isHovered = hoveredItem === item.id

        return (
          <div
            key={item.id}
            className={cn(
              "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer",
              isSelected && "ring-2 ring-brand-500 border-[#bea456]"
            )}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => toggleSelection(item.id)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-gray-100">
              {item.type === 'image' ? (
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <TypeIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Type Badge */}
              <div className={cn("absolute top-2 left-2 p-1.5 rounded border", getFileTypeColor(item.type))}>
                <TypeIcon className="w-3 h-3" />
              </div>

              {/* Duration Badge for Videos */}
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {formatDuration(item.duration)}
                </div>
              )}

              {/* Selection Checkbox */}
              <div className={cn(
                "absolute top-2 right-2 transition-opacity",
                isSelected || isHovered ? "opacity-100" : "opacity-0"
              )}>
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  isSelected
                    ? "bg-[#bea456] border-brand-600"
                    : "bg-white border-white"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>

              {/* Hover Actions */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Create a temporary anchor element to trigger download
                        const link = document.createElement('a')
                        link.href = item.url
                        link.download = item.name
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Store the media URL in sessionStorage to use in post-creator
                        sessionStorage.setItem('preloadedMediaUrl', item.url)
                        sessionStorage.setItem('preloadedMediaName', item.name)
                        // Navigate to post-creator page
                        router.push('/post-creator')
                      }}
                    >
                      <Share2 className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate mb-1">{item.name}</h3>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <FolderOpen className="w-3 h-3" />
                <span>{item.folder}</span>
                <span>•</span>
                <span>{formatFileSize(item.size)}</span>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 2 && (
                    <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                  )}
                </div>
              )}

              {/* Usage Info */}
              {item.usedIn.length > 0 && (
                <div className="text-xs text-gray-500">
                  Used in {item.usedIn.length} post{item.usedIn.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Upload Date */}
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Clock className="w-3 h-3" />
                <span>{formatDate(item.uploadedAt)}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="col-span-full text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No files found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or upload some media</p>
        </div>
      )}
    </div>
  )
}