'use client'

import { useState } from 'react'
import { MediaGrid } from '@/components/dashboard/content-library/media-grid'
import { LibraryFilters } from '@/components/dashboard/content-library/library-filters'
import { LibrarySearch } from '@/components/dashboard/content-library/library-search'
import { LibraryUpload } from '@/components/dashboard/content-library/library-upload'
import { FolderOpen, Upload, Grid, List, Filter, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getMediaAction,
  getFoldersAction,
  createFolderAction,
  uploadMediaAction,
  deleteMediaAction,
  bulkDeleteMediaAction,
  createMediaFormData
} from '@/actions'

// Types for the transformed media items
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

interface FolderItem {
  id: string
  name: string
  media_count: number
  is_default: boolean
}

interface ContentLibraryManagerProps {
  initialMediaItems: MediaItem[]
  initialFolders: FolderItem[]
}

export function ContentLibraryManager({ 
  initialMediaItems, 
  initialFolders 
}: ContentLibraryManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Data state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems)
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transform API data to UI format
  const transformMediaItem = (apiItem: any): MediaItem => {
    return {
      id: apiItem.id.toString(),
      name: apiItem.file_name || 'Untitled',
      type: 'image', // For now, assume all are images since we only support images
      size: apiItem.file_size || 0,
      url: apiItem.url,
      thumbnail: apiItem.url, // Use same URL for thumbnail
      uploadedAt: new Date(apiItem.created_at),
      tags: [], // No tags in current API
      usedIn: [`Used in ${apiItem.used_in_posts_count} posts`],
      folder: apiItem.folder_name || 'Default'
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load both media and folders in parallel
      const [mediaResult, foldersResult] = await Promise.all([
        getMediaAction(),
        getFoldersAction()
      ])

      // Handle media
      if ('error' in mediaResult) {
        setError(mediaResult.error)
        toast.error('Failed to load media')
      } else {
        const transformedMedia = Array.isArray(mediaResult)
          ? mediaResult.map(transformMediaItem)
          : []
        setMediaItems(transformedMedia)
      }

      // Handle folders
      if ('error' in foldersResult) {
        console.error('Failed to load folders:', foldersResult.error)
      } else {
        const folderItems = foldersResult.results || []
        setFolders(folderItems.map((folder: any) => ({
          id: folder.id.toString(),
          name: folder.name,
          media_count: parseInt(folder.media_count),
          is_default: folder.is_default
        })))
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load content library')
      toast.error('Failed to load content library')
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on current filters
  const filteredItems = mediaItems.filter(item => {
    const folderMatch = selectedFolder === 'all' || item.folder === selectedFolder
    const typeMatch = selectedType === 'all' || item.type === selectedType
    const searchMatch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return folderMatch && typeMatch && searchMatch
  })

  const handleUpload = async (files: File[], folderName: string) => {
    try {
      // Find or create folder
      let targetFolder = folders.find(f => f.name === folderName)

      if (!targetFolder && folderName !== 'Default') {
        const createFolderResult = await createFolderAction({ name: folderName })
        if ('error' in createFolderResult) {
          toast.error(`Failed to create folder: ${createFolderResult.error}`)
          return
        }
        targetFolder = {
          id: createFolderResult.id.toString(),
          name: createFolderResult.name,
          media_count: 0,
          is_default: createFolderResult.is_default
        }
        setFolders(prev => [...prev, targetFolder!])
      }

      // Upload files
      const uploadPromises = files.map(async (file) => {
        const formData = await createMediaFormData(
          file,
          targetFolder ? parseInt(targetFolder.id) : undefined,
          file.name
        )

        return uploadMediaAction(formData)
      })

      const results = await Promise.all(uploadPromises)

      // Check for errors
      const errors = results.filter(result => 'error' in result)
      if (errors.length > 0) {
        toast.error(`Failed to upload ${errors.length} files`)
      } else {
        toast.success(`Successfully uploaded ${files.length} files`)
        // Reload data to get updated media list
        loadData()
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed')
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      const result = await createFolderAction({ name: folderName })

      if ('error' in result) {
        toast.error(`Failed to create folder: ${result.error}`)
        return
      }

      const newFolder = {
        id: result.id.toString(),
        name: result.name,
        media_count: 0,
        is_default: result.is_default
      }

      setFolders(prev => [...prev, newFolder])
      toast.success('Folder created successfully')
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const handleDeleteItems = async (itemIds: string[]) => {
    try {
      if (itemIds.length === 1) {
        // Single delete
        const result = await deleteMediaAction(parseInt(itemIds[0]))
        if ('error' in result) {
          toast.error(`Failed to delete media: ${result.error}`)
          return
        }
      } else {
        // Bulk delete
        const result = await bulkDeleteMediaAction({ ids: itemIds.map(id => parseInt(id)) })
        if ('error' in result) {
          toast.error(`Failed to delete media: ${result.error}`)
          return
        }
      }

      toast.success(`Successfully deleted ${itemIds.length} item${itemIds.length > 1 ? 's' : ''}`)
      setSelectedItems([])

      // Reload data to get updated list
      loadData()
    } catch (error) {
      console.error('Failed to delete items:', error)
      toast.error('Failed to delete items')
    }
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                Organize and manage your media assets
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Folder
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#714efe] text-white rounded-lg hover:bg-[#5f3fd6] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Media
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 overflow-hidden">
            {/* Sidebar - Filters */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showFilters
              ? 'w-80 opacity-100'
              : 'w-0 opacity-0'
              }`}>
              <div className="w-80">
                <LibraryFilters
                  folders={folders.map(f => f.name)}
                  selectedFolder={selectedFolder}
                  selectedType={selectedType}
                  onFolderChange={setSelectedFolder}
                  onTypeChange={setSelectedType}
                  onCreateFolder={handleCreateFolder}
                  totalItems={mediaItems.length}
                  filteredItems={filteredItems.length}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6 transition-all duration-500 ease-in-out">
              {/* Search and Actions */}
              <div className="flex items-center justify-between">
                <LibrarySearch
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedItems.length} selected
                    </span>
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteItems(selectedItems)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Media Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#714efe] animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading your media library...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Media</h3>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <button
                      onClick={() => loadData()}
                      className="px-4 py-2 bg-[#714efe] text-white rounded-lg hover:bg-[#5f3fd6] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Media Files</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Upload your first media file to get started with your content library.
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-[#714efe] text-white rounded-lg hover:bg-[#5f3fd6] transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Your First File
                    </button>
                  </div>
                </div>
              ) : (
                <MediaGrid
                  items={filteredItems}
                  viewMode={viewMode}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <LibraryUpload
          folders={folders.map(f => f.name)}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreateFolder={(folderName) => {
            handleCreateFolder(folderName)
            setShowCreateFolder(false)
          }}
        />
      )}
    </div>
  )
}

// Create Folder Modal Component
function CreateFolderModal({ onClose, onCreateFolder }: { onClose: () => void, onCreateFolder: (name: string) => void }) {
  const [folderName, setFolderName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (folderName.trim()) {
      onCreateFolder(folderName.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Folder</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#714efe] focus:border-[#714efe] outline-none transition-all mb-4"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-2 bg-[#714efe] text-white rounded-lg hover:bg-[#5f3fd6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}