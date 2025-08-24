'use client'

export function StorefrontSkeleton() {
  return (
    <div className="flex-1 bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div>
                  <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-md w-20 ml-1 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Editor/Preview Area Skeleton */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
                
                {/* Profile Section Skeleton */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  
                  {/* Form Fields Skeleton */}
                  <div className="space-y-4">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-24 bg-gray-200 rounded w-full animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Quick Actions Skeleton */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Quick Setup Guide Skeleton */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-28 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}