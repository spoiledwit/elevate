'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { HelpCircle } from 'lucide-react'

interface OnboardingTriggerProps {
  expandSection: (sectionId: string) => void
}

export function OnboardingTrigger({ expandSection }: OnboardingTriggerProps) {
  const { startOnboarding, resetOnboarding, hasSeenOnboarding } = useOnboarding(expandSection)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col gap-2">
        {/* Help button that's always visible */}
        <button
          onClick={startOnboarding}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Take a guided tour"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}