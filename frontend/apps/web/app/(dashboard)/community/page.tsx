import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community - The Wealth Creator'
}

export default function CommunityPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">The Wealth Creator Community</h1>
            <p className="text-gray-600 mt-2">Connect with other members of The Wealth Creator community</p>
          </div>

          {/* Community Iframe */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="https://community.thewealthcreator.co/communities/groups/the-wealth-creator/home"
                className="w-full h-full border-0"
                title="The Wealth Creator Community"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
