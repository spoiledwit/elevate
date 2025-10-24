'use client'

interface RulesFiltersProps {
  facebookPages: any
  onFiltersChange: (filters: any) => void
  currentFilters: {
    connection_id: string
  }
}

export function RulesFilters({ facebookPages, onFiltersChange, currentFilters }: RulesFiltersProps) {
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
          >
            <option value="all">All Pages</option>
            {pages.map((page: any) => (
              <option key={page.connection_id} value={page.connection_id}>
                {page.page_name}
              </option>
            ))}
          </select>
        </div>

        {/* Placeholder for future filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rule Status
          </label>
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          >
            <option>All Statuses</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onFiltersChange({ connection_id: undefined })}
          className="text-sm text-[#bea456] hover:text-[#bea456] font-medium"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}