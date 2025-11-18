/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreditBalance } from '../models/CreditBalance';
import type { CreditPurchase } from '../models/CreditPurchase';
import type { CreditPurchaseResponse } from '../models/CreditPurchaseResponse';
import type { CreditTransaction } from '../models/CreditTransaction';
import type { DeductMiloCredits } from '../models/DeductMiloCredits';
import type { DeductMiloCreditsResponse } from '../models/DeductMiloCreditsResponse';
import type { EndMiloCall } from '../models/EndMiloCall';
import type { EndMiloCallResponse } from '../models/EndMiloCallResponse';
import type { MiloCallLog } from '../models/MiloCallLog';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CreditsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get current user's Milo credit balance and usage statistics
     * @returns CreditBalance
     * @throws ApiError
     */
    public creditsBalanceRetrieve(): CancelablePromise<CreditBalance> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/credits/balance/',
        });
    }
    /**
     * Get current user's Milo AI call history
     * @returns MiloCallLog
     * @throws ApiError
     */
    public creditsCallLogsList(): CancelablePromise<Array<MiloCallLog>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/credits/call-logs/',
        });
    }
    /**
     * Deduct credits for Milo AI voice calls. Rate: 0.5 credits per minute. Only charges for new minutes not already charged.
     * @param requestBody
     * @returns DeductMiloCreditsResponse
     * @throws ApiError
     */
    public creditsDeductCreate(
        requestBody: DeductMiloCredits,
    ): CancelablePromise<DeductMiloCreditsResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/credits/deduct/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * End a Milo AI voice call session and finalize the call log.
     * @param requestBody
     * @returns EndMiloCallResponse
     * @throws ApiError
     */
    public creditsEndCallCreate(
        requestBody: EndMiloCall,
    ): CancelablePromise<EndMiloCallResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/credits/end-call/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a Stripe checkout session for purchasing Milo credits. Price is $1.00 per credit.
     * @param requestBody
     * @returns CreditPurchaseResponse
     * @throws ApiError
     */
    public creditsPurchaseCreate(
        requestBody: CreditPurchase,
    ): CancelablePromise<CreditPurchaseResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/credits/purchase/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's credit transaction history
     * @returns CreditTransaction
     * @throws ApiError
     */
    public creditsTransactionsList(): CancelablePromise<Array<CreditTransaction>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/credits/transactions/',
        });
    }
}
