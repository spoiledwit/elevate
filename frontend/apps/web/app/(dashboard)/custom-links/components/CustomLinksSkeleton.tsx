'use client'

export function CustomLinksSkeleton() {
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
                  <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
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
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Links List Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-white"
                  >
                    {/* Drag Handle Skeleton */}
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>

                    {/* Thumbnail Skeleton */}
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>

                    {/* Link Info Skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                        {i % 3 === 0 && (
                          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                        )}
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Actions Skeleton */}
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}