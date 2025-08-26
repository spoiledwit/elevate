/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AutomationStatsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get automation statistics for user's connections.
     * @returns any No response body
     * @throws ApiError
     */
    public automationStatsRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/automation-stats/',
        });
    }
}
