'use client'

export function ConnectPromoBanner() {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Join our creator network
          </h3>
          <p className="text-purple-700 text-sm mb-4 max-w-md">
            Get access to our premium creator network and earn up to 30% commission on referrals.
          </p>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Learn more
          </button>
        </div>
        
        <div className="hidden md:flex items-center">
          <div className="w-24 h-24 bg-purple-300 rounded-full flex items-center justify-center">
            <NetworkIcon className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}