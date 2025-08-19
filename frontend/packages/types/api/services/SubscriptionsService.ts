/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckoutSession } from '../models/CheckoutSession';
import type { CheckoutSessionResponse } from '../models/CheckoutSessionResponse';
import type { PortalSessionResponse } from '../models/PortalSessionResponse';
import type { Subscription } from '../models/Subscription';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SubscriptionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Cancel subscription at the end of the current billing period
     * @returns any
     * @throws ApiError
     */
    public subscriptionsCancelCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/subscriptions/cancel/',
        });
    }
    /**
     * Create a Stripe checkout session for subscription with free trial
     * @param requestBody
     * @returns CheckoutSessionResponse
     * @throws ApiError
     */
    public subscriptionsCreateCheckoutCreate(
        requestBody: CheckoutSession,
    ): CancelablePromise<CheckoutSessionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/subscriptions/create-checkout/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a Stripe Customer Portal session for self-service billing management
     * @returns PortalSessionResponse
     * @throws ApiError
     */
    public subscriptionsCreatePortalCreate(): CancelablePromise<PortalSessionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/subscriptions/create-portal/',
        });
    }
    /**
     * Get current subscription status including trial information
     * @returns Subscription
     * @throws ApiError
     */
    public subscriptionsCurrentRetrieve(): CancelablePromise<Subscription> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/subscriptions/current/',
        });
    }
}
