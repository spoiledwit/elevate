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
          className="text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105" style={{backgroundColor: '#714efe'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#5f3fd6'} onMouseLeave={(e) => e.target.style.backgroundColor = '#714efe'}
          title="Take a guided tour"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}