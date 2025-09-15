import { Suspense } from 'react'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

// Separate component for the order cancelled content that uses searchParams
function OrderCancelledContent({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order ID</p>
            <p className="font-mono text-lg font-semibold text-gray-900">{orderId}</p>
            <p className="text-sm text-orange-600 mt-1">Status: Cancelled</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <CreditCard className="w-4 h-4 mr-2" />
            You can try again anytime with a different payment method.
          </div>

          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Try Payment Again
            </button>

            <Link 
              href="/"
              className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderCancelledPage({ searchParams }: { searchParams: { order_id?: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <OrderCancelledContent searchParams={searchParams} />
    </Suspense>
  )
}