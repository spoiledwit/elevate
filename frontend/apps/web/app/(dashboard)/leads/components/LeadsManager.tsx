'use client'

import { useState } from 'react'
import {
  Users,
  Package,
  DollarSign,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Settings
} from 'lucide-react'
import { getOrdersPaginatedAction, updateOrderEmailPreferenceAction } from '@/actions/orders-action'
import { updateProfileEmailAutomationAction } from '@/actions/profile-action'
import { toast } from 'sonner'

interface LeadsManagerProps {
  initialOrders: any[]
  initialPage?: number
  initialCount?: number
  profileEmailAutomation?: boolean
}

export function LeadsManager({ initialOrders, initialPage = 1, initialCount = 0, profileEmailAutomation = true }: LeadsManagerProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalCount, setTotalCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [profileEmailAutomationEnabled, setProfileEmailAutomationEnabled] = useState(profileEmailAutomation)

  const pageSize = 10 // Backend default page size
  const totalPages = Math.ceil(totalCount / pageSize)

  const loadPage = async (page: number) => {
    setIsLoading(true)
    try {
      const result = await getOrdersPaginatedAction(page)
      if (!('error' in result)) {
        setOrders(result.results || [])
        setTotalCount(result.count || 0)
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadPage(currentPage + 1)
    }
  }

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setSelectedOrder(null)
  }

  const handleToggleEmailAutomation = async (orderId: string, currentValue: boolean, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the dialog when clicking toggle

    const newValue = !currentValue

    try {
      const result = await updateOrderEmailPreferenceAction(orderId, newValue)

      if (result.success) {
        // Update local state
        setOrders(prev => prev.map(order =>
          order.id === parseInt(orderId)
            ? { ...order, email_automation_enabled: newValue }
            : order
        ))

        // Update selected order if it's open in the dialog
        if (selectedOrder && selectedOrder.id === parseInt(orderId)) {
          setSelectedOrder({ ...selectedOrder, email_automation_enabled: newValue })
        }

        toast.success(
          newValue
            ? 'Email automation enabled for this lead'
            : 'Email automation paused for this lead'
        )
      } else {
        toast.error(result.error || 'Failed to update email preference')
      }
    } catch (error) {
      console.error('Error toggling email automation:', error)
      toast.error('An error occurred while updating email preference')
    }
  }

  const handleToggleProfileEmailAutomation = async () => {
    const newValue = !profileEmailAutomationEnabled

    try {
      const result = await updateProfileEmailAutomationAction(newValue)

      if (result.success) {
        setProfileEmailAutomationEnabled(newValue)
        toast.success(
          newValue
            ? 'Email automation enabled by default for new leads'
            : 'Email automation disabled by default for new leads'
        )
      } else {
        toast.error(result.error || 'Failed to update email automation default')
      }
    } catch (error) {
      console.error('Error toggling profile email automation:', error)
      toast.error('An error occurred while updating email automation default')
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    View and manage customer orders from your products
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleProfileEmailAutomation}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profileEmailAutomationEnabled
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={profileEmailAutomationEnabled ? 'Email automation enabled by default for new leads' : 'Email automation disabled by default for new leads'}
                >
                  {profileEmailAutomationEnabled ? (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Auto Emails: ON</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span>Auto Emails: OFF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Leads</p>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>

          <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, o) => sum + (parseFloat(o.checkout_price) || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Loading leads...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                <p className="text-gray-600">
                  Orders from your products will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-brand-300 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {order.customer_name || 'Anonymous'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-sm text-gray-600 truncate">
                              {order.customer_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Email Automation Toggle */}
                          <button
                            onClick={(e) => handleToggleEmailAutomation(String(order.id), order.email_automation_enabled ?? true, e)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              order.email_automation_enabled !== false
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={order.email_automation_enabled !== false ? 'Click to pause automated emails' : 'Click to enable automated emails'}
                          >
                            {order.email_automation_enabled !== false ? (
                              <>
                                <Bell className="w-3 h-3 mr-1" />
                                Auto Emails
                              </>
                            ) : (
                              <>
                                <BellOff className="w-3 h-3 mr-1" />
                                Paused
                              </>
                            )}
                          </button>

                          {order.status === 'completed' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span className="truncate">{order.product_title}</span>
                        </div>
                        {order.checkout_price && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>${parseFloat(order.checkout_price).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="px-6 pb-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages} ({totalCount} total leads)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-brand-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      {showDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px' }}>
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-600">Order #{selectedOrder.order_id}</p>
                </div>
              </div>
              <button
                onClick={closeDialog}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedOrder.customer_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedOrder.customer_email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedOrder.product_title}
                    </span>
                  </div>
                  {selectedOrder.product_subtitle && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Description:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOrder.product_subtitle}
                      </span>
                    </div>
                  )}
                  {selectedOrder.checkout_price && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${parseFloat(selectedOrder.checkout_price).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Order Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium">
                      {selectedOrder.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      )}
                      {selectedOrder.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {selectedOrder.status === 'cancelled' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancelled
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order ID:</span>
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      {selectedOrder.order_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Automation Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Automation
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Automated Emails</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedOrder.email_automation_enabled !== false
                          ? 'This lead will receive automated follow-up emails'
                          : 'Automated emails are paused. You can send manual emails instead.'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleEmailAutomation(String(selectedOrder.id), selectedOrder.email_automation_enabled ?? true, e)
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedOrder.email_automation_enabled !== false
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedOrder.email_automation_enabled !== false ? (
                        <span className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <BellOff className="w-4 h-4" />
                          Paused
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Responses */}
              {selectedOrder.formatted_responses && selectedOrder.formatted_responses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Form Responses
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {selectedOrder.formatted_responses.map((response: any, index: number) => (
                      <div key={index} className="pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {response.question}
                        </p>
                        <p className="text-sm text-gray-900">
                          {response.answer || 'No response'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Form Data (if no formatted responses) */}
              {selectedOrder.form_responses && (!selectedOrder.formatted_responses || selectedOrder.formatted_responses.length === 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Form Data
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedOrder.form_responses, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeDialog}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}