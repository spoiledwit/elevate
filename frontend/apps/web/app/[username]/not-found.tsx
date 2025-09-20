import Link from 'next/link'
import { Search, ArrowLeft, Users } from 'lucide-react'

export default function StorefrontNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
          <Users className="w-12 h-12 text-gray-400" />
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Not Found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The profile you're looking for doesn't exist or may have been deactivated.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>

          <div className="text-sm text-gray-500">
            or
          </div>

          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
          >
            <Search className="w-4 h-4" />
            Create Your Own Profile
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a
              href="https://elevate.social"
              className="text-brand-600 hover:text-purple-700 font-medium"
            >
              Elevate Social
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}