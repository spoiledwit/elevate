'use client'

export function CTABannerSkeleton() {
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
                  <div className="h-8 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Banner Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-24 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* All Banners List Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-28 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-white"
                  >
                    {/* Banner Preview Skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="h-20 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
                      
                      <div className="flex items-center gap-4">
                        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Actions Skeleton */}
                    <div className="flex items-center gap-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips Section Skeleton */}
          <div className="mt-8 bg-gray-100 border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
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