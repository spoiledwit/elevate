import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - The Wealth Creator'
}

export default function FAQPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
            <p className="text-gray-600 mt-2">Find answers to common questions about The Wealth Creator</p>
          </div>

          {/* FAQ Iframe */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="https://thewealthcreator.co/faq-es"
                className="w-full h-full border-0"
                title="The Wealth Creator FAQ"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
