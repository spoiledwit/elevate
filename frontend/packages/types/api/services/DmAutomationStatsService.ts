/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DmAutomationStatsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get DM automation statistics for user's connections.
     * @returns any No response body
     * @throws ApiError
     */
    public dmAutomationStatsRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/dm-automation-stats/',
        });
    }
}
