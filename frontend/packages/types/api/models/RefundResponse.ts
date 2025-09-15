/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response serializer for refund operations
 */
export type RefundResponse = {
    /**
     * Stripe refund ID
     */
    refund_id: string;
    /**
     * Amount refunded in cents
     */
    amount_refunded: number;
    /**
     * Refund status
     */
    status: string;
    /**
     * Updated transaction status
     */
    transaction_status: string;
};

