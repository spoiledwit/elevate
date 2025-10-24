'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import {
  ApiError,
  OrderStatusEnum,
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Type definitions for order actions
export interface OrderFilters {
  page?: number
  status?: 'pending' | 'completed' | 'cancelled'
  product_id?: number
}

export interface OrderStatsResponse {
  total_orders: number
  pending_orders: number
  completed_orders: number
  cancelled_orders: number
  total_revenue: number
  recent_orders_30d: number
  orders_by_product: Array<{
    custom_link__id: number
    custom_link__title: string
    count: number
  }>
}

// =============================================================================
// ORDER ACTIONS
// =============================================================================

/**
 * Get all orders for the current user's products
 */
export async function getOrdersAction(filters?: OrderFilters) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.orders.ordersList(filters?.page)

    return response
  } catch (error) {
    console.error('Error fetching orders:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch orders' }
  }
}

/**
 * Get orders with pagination (client-side version)
 */
export async function getOrdersPaginatedAction(page: number = 1) {
  return getOrdersAction({ page })
}

/**
 * Get a single order by ID
 */
export async function getOrderByIdAction(orderId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.orders.ordersRetrieve(orderId)

    return response
  } catch (error) {
    console.error('Error fetching order:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch order' }
  }
}

/**
 * Get order statistics for the current user's products
 */
export async function getOrderStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.orders.ordersStatsRetrieve()

    return response as any
  } catch (error) {
    console.error('Error fetching order stats:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch order stats' }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatusEnum
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.orders.ordersUpdateStatusPartialUpdate(orderId, { status })

    return response
  } catch (error) {
    console.error('Error updating order status:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to update order status' }
  }
}

/**
 * Delete an order
 */
export async function deleteOrderAction(orderId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.orders.ordersDestroy(orderId)

    return { success: true }
  } catch (error) {
    console.error('Error deleting order:', error)
    if (error instanceof ApiError) {
      return { error: error.message }
    }
    return { error: 'Failed to delete order' }
  }
}