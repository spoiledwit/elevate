'use client'

export function QuickActions() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <a
            href="/dashboard/custom-links"
            className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <div className="font-medium text-blue-900">Manage Links</div>
            <div className="text-sm text-blue-700">Add or edit your custom links</div>
          </a>

          <a
            href="/dashboard/cta-banners"
            className="block w-full text-left px-4 py-3 rounded-lg border transition-colors" style={{ backgroundColor: '#714efe1a', borderColor: '#714efe33' }}
          >
            <div className="font-medium" style={{ color: '#5f3fd6' }}>Edit CTA Banner</div>
            <div className="text-sm" style={{ color: '#714efe' }}>Create promotional banners</div>
          </a>

          <a
            href="/dashboard/storefront"
            className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <div className="font-medium text-green-900">Customize Profile</div>
            <div className="text-sm text-green-700">Update your profile settings</div>
          </a>
        </div>
      </div>
    </div>
  )
}

