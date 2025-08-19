/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedPlanList } from '../models/PaginatedPlanList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PlansService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List all active subscription plans
     * Returns all active subscription plans with their features for public display on pricing page.
     * @param page A page number within the paginated result set.
     * @returns PaginatedPlanList
     * @throws ApiError
     */
    public plansList(
        page?: number,
    ): CancelablePromise<PaginatedPlanList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/plans/',
            query: {
                'page': page,
            },
        });
    }
}
