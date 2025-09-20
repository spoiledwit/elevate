'use client'

interface CommentsFiltersProps {
  facebookPages: any
  onFiltersChange: (filters: any) => void
  currentFilters: {
    connection_id: string
    status: string
  }
}

export function CommentsFilters({ facebookPages, onFiltersChange, currentFilters }: CommentsFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...currentFilters,
      [key]: value === 'all' ? undefined : value
    }
    onFiltersChange(newFilters)
  }

  const pages = facebookPages?.pages || []

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook Page Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facebook Page
          </label>
          <select
            value={currentFilters.connection_id}
            onChange={(e) => handleFilterChange('connection_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Pages</option>
            {pages.map((page: any) => (
              <option key={page.connection_id} value={page.connection_id}>
                {page.page_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={currentFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="ignored">Ignored</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onFiltersChange({ connection_id: undefined, status: undefined })}
          className="text-sm text-brand-600 hover:text-purple-700 font-medium"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}