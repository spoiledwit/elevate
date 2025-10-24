'use client'

import {
  Zap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target
} from 'lucide-react'

interface RulesStatsProps {
  totalRules: number
  activeRules: number
  inactiveRules: number
  rules: any[]
}

export function RulesStats({
  totalRules,
  activeRules,
  inactiveRules,
  rules
}: RulesStatsProps) {
  // Calculate total triggers across all rules
  const totalTriggers = rules.reduce((sum, rule) => sum + (rule.times_triggered || 0), 0)

  // Calculate average triggers per rule
  const avgTriggers = totalRules > 0 ? (totalTriggers / totalRules) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-[#bea4561a] rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#bea456]" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Total Rules</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{totalRules}</div>
        <div className="text-xs text-gray-500 mt-1">All automation rules</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Active Rules</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{activeRules}</div>
        <div className="text-xs text-gray-500 mt-1">Currently running</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <XCircle className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Inactive Rules</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{inactiveRules}</div>
        <div className="text-xs text-gray-500 mt-1">Paused or disabled</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Total Triggers</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{totalTriggers}</div>
        <div className="text-xs text-gray-500 mt-1">All time activations</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Avg. Triggers</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{avgTriggers.toFixed(1)}</div>
        <div className="text-xs text-gray-500 mt-1">Per rule</div>
      </div>
    </div>
  )
}