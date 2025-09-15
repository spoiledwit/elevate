/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReasonEnum } from './ReasonEnum';
/**
 * Serializer for refund requests
 */
export type RefundRequest = {
    /**
     * Payment intent ID to refund
     */
    payment_intent_id: string;
    /**
     * Amount to refund in cents (full refund if not specified)
     */
    amount_cents?: number;
    /**
     * Reason for the refund
     *
     * * `duplicate` - duplicate
     * * `fraudulent` - fraudulent
     * * `requested_by_customer` - requested_by_customer
     */
    reason?: ReasonEnum;
};

