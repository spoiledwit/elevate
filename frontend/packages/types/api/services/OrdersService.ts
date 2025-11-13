/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Order } from '../models/Order';
import type { PaginatedOrderList } from '../models/PaginatedOrderList';
import type { PatchedOrder } from '../models/PatchedOrder';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class OrdersService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * ViewSet for viewing orders.
     * Users can only see orders from their own products (CustomLinks).
     * @param page A page number within the paginated result set.
     * @returns PaginatedOrderList
     * @throws ApiError
     */
    public ordersList(
        page?: number,
    ): CancelablePromise<PaginatedOrderList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/orders/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for viewing orders.
     * Users can only see orders from their own products (CustomLinks).
     * @param id
     * @returns Order
     * @throws ApiError
     */
    public ordersRetrieve(
        id: string,
    ): CancelablePromise<Order> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/orders/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update email automation preference for a single order.
     * Allows affiliates to opt-out specific leads from automated email sequences.
     * @param id
     * @param requestBody
     * @returns Order
     * @throws ApiError
     */
    public ordersUpdateEmailPreferencePartialUpdate(
        id: string,
        requestBody?: PatchedOrder,
    ): CancelablePromise<Order> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/orders/{id}/update_email_preference/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update order status.
     * Only the owner of the product can update the order status.
     * @param id
     * @param requestBody
     * @returns Order
     * @throws ApiError
     */
    public ordersUpdateStatusPartialUpdate(
        id: string,
        requestBody?: PatchedOrder,
    ): CancelablePromise<Order> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/orders/{id}/update_status/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Bulk update email automation preference for multiple orders.
     * Allows affiliates to enable/disable automation for multiple leads at once.
     * @param requestBody
     * @returns Order
     * @throws ApiError
     */
    public ordersBulkUpdateEmailPreferenceCreate(
        requestBody: Order,
    ): CancelablePromise<Order> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/orders/bulk_update_email_preference/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get order statistics for the current user's products.
     * Returns counts by status, revenue, and recent orders.
     * @returns Order
     * @throws ApiError
     */
    public ordersStatsRetrieve(): CancelablePromise<Order> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/orders/stats/',
        });
    }
}
