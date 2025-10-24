import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Library - Elevate Social'
}

export default function PromptLibraryPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
            <p className="text-gray-600 mt-2">Access curated prompts and templates for your content creation</p>
          </div>

          {/* Prompt Library Iframe */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="https://highticketpurpose.com/milo"
                className="w-full h-full border-0"
                title="Prompt Library"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
