'use client'

import { useState } from 'react'
import {
  Zap,
  Plus,
  Search,
  RefreshCw,
  Filter
} from 'lucide-react'
import { RulesList } from './RulesList'
import { RulesFilters } from './RulesFilters'
import { RulesStats } from './RulesStats'
import { RuleForm } from './RuleForm'
import { getAutomationRulesAction } from '@/actions'

interface AutomationRulesManagerProps {
  initialRules: any
  facebookPages: any
}

export function AutomationRulesManager({ initialRules, facebookPages }: AutomationRulesManagerProps) {
  const [rules, setRules] = useState(initialRules)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [connectionFilter, setConnectionFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Refresh rules
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const filters = {
        connection_id: connectionFilter !== 'all' ? parseInt(connectionFilter) : undefined
      }
      const result = await getAutomationRulesAction(filters)
      if (!('error' in result)) {
        setRules(result)
      }
    } catch (error) {
      console.error('Error refreshing rules:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const handleFiltersChange = async (filters: any) => {
    setConnectionFilter(filters.connection_id || 'all')
    setLoading(true)
    
    try {
      const result = await getAutomationRulesAction({
        connection_id: filters.connection_id || undefined
      })
      if (!('error' in result)) {
        setRules(result)
      }
    } catch (error) {
      console.error('Error applying filters:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = rules?.results?.filter((rule: any) => {
    if (searchQuery) {
      return rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             rule.reply_template.toLowerCase().includes(searchQuery.toLowerCase()) ||
             rule.keywords?.some((keyword: string) => 
               keyword.toLowerCase().includes(searchQuery.toLowerCase())
             )
    }
    return true
  }) || []

  const getStatusCount = (status: string) => {
    if (!rules?.results) return 0
    if (status === 'all') return rules.results.length
    return rules.results.filter((r: any) => 
      status === 'active' ? r.is_active : !r.is_active
    ).length
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#714efe1a] rounded-xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-[#714efe]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
                  <p className="text-gray-600">
                    Create and manage keyword-based comment automation rules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    showFilters
                      ? 'bg-[#714efe1a] text-[#714efe]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#714efe] text-white rounded-lg hover:bg-[#5f3fd6] transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <RulesStats
            totalRules={getStatusCount('all')}
            activeRules={getStatusCount('active')}
            inactiveRules={getStatusCount('inactive')}
            rules={rules?.results || []}
          />

          {/* Filters */}
          {showFilters && (
            <RulesFilters
              facebookPages={facebookPages}
              onFiltersChange={handleFiltersChange}
              currentFilters={{
                connection_id: connectionFilter
              }}
            />
          )}

          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rules by name, keywords, or reply template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rules List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Automation Rules ({filteredRules.length})
                </h2>
              </div>

              <RulesList 
                rules={filteredRules}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Rule Form Modal */}
      {showCreateForm && (
        <RuleForm
          facebookPages={facebookPages}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}