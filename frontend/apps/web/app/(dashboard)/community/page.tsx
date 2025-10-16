import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community - Elevate Social'
}

export default function CommunityPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Elevate Community</h1>
            <p className="text-gray-600 mt-2">Connect with other members of the High Ticket Purpose community</p>
          </div>

          {/* Community Iframe */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="https://highticketpurpose.app.clientclub.net/communities/groups/high-ticket-purpose/home"
                className="w-full h-full border-0"
                title="Elevate Community"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
