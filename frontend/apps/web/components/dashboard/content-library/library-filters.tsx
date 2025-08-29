'use client'

import { FolderOpen, Image, Video, FileText, Archive, Filter, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LibraryFiltersProps {
  folders: string[]
  selectedFolder: string
  selectedType: string
  onFolderChange: (folder: string) => void
  onTypeChange: (type: string) => void
  onCreateFolder: (folderName: string) => void
  totalItems: number
  filteredItems: number
}

const fileTypes = [
  { id: 'all', name: 'All Files', icon: Filter, count: 0 },
  { id: 'image', name: 'Images', icon: Image, count: 0 },
  { id: 'video', name: 'Videos', icon: Video, count: 0 },
  { id: 'document', name: 'Documents', icon: FileText, count: 0 },
  { id: 'archive', name: 'Archives', icon: Archive, count: 0 }
]

export function LibraryFilters({
  folders,
  selectedFolder,
  selectedType,
  onFolderChange,
  onTypeChange,
  onCreateFolder,
  totalItems,
  filteredItems
}: LibraryFiltersProps) {

  const clearAllFilters = () => {
    onFolderChange('all')
    onTypeChange('all')
  }

  const hasActiveFilters = selectedFolder !== 'all' || selectedType !== 'all'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredItems}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> files
        </p>
      </div>

      {/* Folder Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Folders</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => onFolderChange('all')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedFolder === 'all'
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <FolderOpen className={cn("w-4 h-4", selectedFolder === 'all' ? "text-purple-600" : "text-gray-400")} />
            <span className="flex-1 text-left">All Folders</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedFolder === folder
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Folder className={cn("w-4 h-4", selectedFolder === folder ? "text-purple-600" : "text-gray-400")} />
              <span className="flex-1 text-left">{folder}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Type Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">File Types</h4>
        <div className="space-y-1">
          {fileTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-purple-600" : "text-gray-400")} />
                <span className="flex-1 text-left">{type.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}