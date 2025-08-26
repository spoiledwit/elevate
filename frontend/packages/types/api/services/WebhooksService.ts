/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class WebhooksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Handle webhook verification challenge from Facebook.
     * @returns any No response body
     * @throws ApiError
     */
    public webhooksFacebookRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/webhooks/facebook/',
        });
    }
    /**
     * Handle webhook events from Facebook.
     * @returns any No response body
     * @throws ApiError
     */
    public webhooksFacebookCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/webhooks/facebook/',
        });
    }
    /**
     * Stripe webhook endpoint for payment events
     * @returns any
     * @throws ApiError
     */
    public webhooksStripeCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/webhooks/stripe/',
        });
    }
}
