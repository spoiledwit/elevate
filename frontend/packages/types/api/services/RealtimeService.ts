/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RealtimeService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Generate an ephemeral token for OpenAI Realtime API
     * @returns any No response body
     * @throws ApiError
     */
    public realtimeSessionCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/realtime/session/',
        });
    }
    /**
     * Check if realtime API is available and configured
     * @returns any No response body
     * @throws ApiError
     */
    public realtimeStatusRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/realtime/status/',
        });
    }
}
