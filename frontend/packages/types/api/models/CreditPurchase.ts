/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for credit purchase request
 */
export type CreditPurchase = {
    /**
     * Amount of credits to purchase
     */
    amount: string;
    /**
     * URL to redirect after successful purchase
     */
    success_url?: string;
    /**
     * URL to redirect if purchase is canceled
     */
    cancel_url?: string;
};

