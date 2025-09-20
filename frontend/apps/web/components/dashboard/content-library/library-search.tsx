'use client'

import { Search, X } from 'lucide-react'

interface LibrarySearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function LibrarySearch({ searchQuery, onSearchChange }: LibrarySearchProps) {
  return (
    <div className="relative max-w-md mt-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search files, tags, or folders..."
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#714efe] focus:border-[#714efe] outline-none transition-all"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  )
}