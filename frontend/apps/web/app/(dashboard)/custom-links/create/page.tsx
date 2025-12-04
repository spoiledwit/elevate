import { LinkForm } from '../components/LinkForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Product - Elevate Social',
  description: 'Create a new product for your storefront'
}

export default function CreateProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div>
            <div className="flex items-center gap-4">
              <Link
                href="/custom-links"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="w-full">
          <LinkForm />
        </div>
      </div>
    </div>
  )
}