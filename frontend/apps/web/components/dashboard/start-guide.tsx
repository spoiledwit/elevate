'use client'

import { useState } from 'react'

export function StartGuide() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">My start guide</h2>
          <span className="text-sm text-gray-500">0 / 3</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-5 h-5 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Connect your first social account</span>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-5 h-5 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Create your first content post</span>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-5 h-5 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Set up your monetization</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}