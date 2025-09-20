import { Suspense } from 'react'
import { CheckCircle, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Separate component for the order success content that uses searchParams
function OrderSuccessContent({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
        </div>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order ID</p>
            <p className="font-mono text-lg font-semibold text-gray-900">{orderId}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <Download className="w-4 h-4 mr-2" />
            You will receive an email with your digital product shortly.
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const params = await searchParams

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    }>
      <OrderSuccessContent searchParams={params} />
    </Suspense>
  )
}