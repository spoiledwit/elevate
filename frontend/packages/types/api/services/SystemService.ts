/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedIframeMenuItemList } from '../models/PaginatedIframeMenuItemList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List active iframe menu items
     * Get a list of all active iframe menu items ordered by their display order.
     * @param page A page number within the paginated result set.
     * @returns PaginatedIframeMenuItemList
     * @throws ApiError
     */
    public iframeMenuItemsList(
        page?: number,
    ): CancelablePromise<PaginatedIframeMenuItemList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/iframe-menu-items/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * List active iframe menu items
     * Get a list of all active iframe menu items ordered by their display order.
     * @param id A unique integer value identifying this iframe menu item.
     * @param page A page number within the paginated result set.
     * @returns PaginatedIframeMenuItemList
     * @throws ApiError
     */
    public iframeMenuItemsList2(
        id: number,
        page?: number,
    ): CancelablePromise<PaginatedIframeMenuItemList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/iframe-menu-items/{id}/',
            path: {
                'id': id,
            },
            query: {
                'page': page,
            },
        });
    }
}
