/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountLink } from '../models/AccountLink';
import type { AccountLinkResponse } from '../models/AccountLinkResponse';
import type { Balance } from '../models/Balance';
import type { CheckoutSessionResponse } from '../models/CheckoutSessionResponse';
import type { ConnectAccountStatus } from '../models/ConnectAccountStatus';
import type { ConnectEarnings } from '../models/ConnectEarnings';
import type { ConnectWebhookEvent } from '../models/ConnectWebhookEvent';
import type { CreateCheckoutSession } from '../models/CreateCheckoutSession';
import type { CreateConnectAccount } from '../models/CreateConnectAccount';
import type { LoginLinkResponse } from '../models/LoginLinkResponse';
import type { PaymentTransaction } from '../models/PaymentTransaction';
import type { RefundRequest } from '../models/RefundRequest';
import type { RefundResponse } from '../models/RefundResponse';
import type { StripeConnectAccount } from '../models/StripeConnectAccount';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class StripeConnectService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Connect account status
     * Get the user's Stripe Connect account status
     * @returns StripeConnectAccount
     * @throws ApiError
     */
    public stripeConnectAccountRetrieve(): CancelablePromise<StripeConnectAccount> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/account/',
            errors: {
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Create Connect account
     * Create a new Stripe Connect account for the user
     * @param requestBody
     * @returns StripeConnectAccount
     * @throws ApiError
     */
    public stripeConnectAccountCreate(
        requestBody?: CreateConnectAccount,
    ): CancelablePromise<StripeConnectAccount> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/account/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Account already exists or validation error`,
            },
        });
    }
    /**
     * Create account link for onboarding
     * Create an account link for Connect onboarding
     * @param requestBody
     * @returns AccountLinkResponse
     * @throws ApiError
     */
    public stripeConnectAccountLinkCreate(
        requestBody: AccountLink,
    ): CancelablePromise<AccountLinkResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/account-link/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Get account balance
     * Get the Connect account balance
     * @returns Balance
     * @throws ApiError
     */
    public stripeConnectBalanceRetrieve(): CancelablePromise<Balance> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/balance/',
            errors: {
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Create checkout session for product purchase
     * Create a Stripe Checkout session for a product purchase
     * @param requestBody
     * @returns CheckoutSessionResponse
     * @throws ApiError
     */
    public stripeConnectCheckoutCreate(
        requestBody: CreateCheckoutSession,
    ): CancelablePromise<CheckoutSessionResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/checkout/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error or seller setup incomplete`,
                404: `Product not found`,
            },
        });
    }
    /**
     * Get dashboard information for Connect account
     * @returns any No response body
     * @throws ApiError
     */
    public stripeConnectDashboardInfoRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/dashboard-info/',
        });
    }
    /**
     * Get earnings summary
     * Get earnings summary for the seller
     * @returns ConnectEarnings
     * @throws ApiError
     */
    public stripeConnectEarningsRetrieve(): CancelablePromise<ConnectEarnings> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/earnings/',
            errors: {
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Create Express Dashboard login link
     * Create a login link to the Express Dashboard
     * @returns LoginLinkResponse
     * @throws ApiError
     */
    public stripeConnectLoginLinkCreate(): CancelablePromise<LoginLinkResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/login-link/',
            errors: {
                400: `Account not ready for dashboard access`,
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Simple endpoint to check if user needs to complete onboarding
     * @returns any No response body
     * @throws ApiError
     */
    public stripeConnectOnboardingStatusRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/onboarding-status/',
        });
    }
    /**
     * Process a refund
     * Process a refund for a payment
     * @param requestBody
     * @returns RefundResponse
     * @throws ApiError
     */
    public stripeConnectRefundCreate(
        requestBody: RefundRequest,
    ): CancelablePromise<RefundResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/refund/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                404: `Transaction not found`,
            },
        });
    }
    /**
     * Refresh account status from Stripe
     * Refresh and get the latest account status from Stripe
     * @returns ConnectAccountStatus
     * @throws ApiError
     */
    public stripeConnectStatusRetrieve(): CancelablePromise<ConnectAccountStatus> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/status/',
            errors: {
                404: `Connect account not found`,
            },
        });
    }
    /**
     * List payment transactions
     * Get payment transactions for the authenticated seller
     * @returns PaymentTransaction
     * @throws ApiError
     */
    public stripeConnectTransactionsList(): CancelablePromise<Array<PaymentTransaction>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/transactions/',
            errors: {
                404: `Connect account not found`,
            },
        });
    }
    /**
     * Handle incoming Stripe Connect webhook events
     * @returns any No response body
     * @throws ApiError
     */
    public stripeConnectWebhookCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/stripe-connect/webhook/',
        });
    }
    /**
     * List Connect webhook events
     * Get recent Connect webhook events for debugging
     * @returns ConnectWebhookEvent
     * @throws ApiError
     */
    public stripeConnectWebhookEventsList(): CancelablePromise<Array<ConnectWebhookEvent>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/stripe-connect/webhook-events/',
        });
    }
}
