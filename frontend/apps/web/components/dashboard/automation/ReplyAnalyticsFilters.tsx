'use client'

interface ReplyAnalyticsFiltersProps {
  facebookPages: any
  onFiltersChange: (filters: {
    connection_id: number | undefined
    status: 'pending' | 'sent' | 'failed' | undefined
    date_range: string
  }) => void
  currentFilters: {
    connection_id: number | undefined
    status: 'pending' | 'sent' | 'failed' | undefined
    date_range: string
  }
}

export function ReplyAnalyticsFilters({ facebookPages, onFiltersChange, currentFilters }: ReplyAnalyticsFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    let processedValue: any = value === 'all' ? undefined : value
    
    // Convert connection_id to number
    if (key === 'connection_id' && processedValue !== undefined) {
      processedValue = parseInt(processedValue)
    }
    
    const newFilters = {
      ...currentFilters,
      [key]: processedValue
    }
    onFiltersChange(newFilters)
  }

  const pages = facebookPages?.pages || []

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Facebook Page Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facebook Page
          </label>
          <select
            value={currentFilters.connection_id?.toString() || 'all'}
            onChange={(e) => handleFilterChange('connection_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            Reply Status
          </label>
          <select
            value={currentFilters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={currentFilters.date_range}
            onChange={(e) => handleFilterChange('date_range', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onFiltersChange({ 
            connection_id: undefined, 
            status: undefined, 
            date_range: '30' 
          })}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}