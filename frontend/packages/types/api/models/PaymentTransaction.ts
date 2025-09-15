/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentTransactionStatusEnum } from './PaymentTransactionStatusEnum';
/**
 * Serializer for PaymentTransaction model
 */
export type PaymentTransaction = {
    readonly id: number;
    readonly order_id: string;
    readonly seller_username: string;
    readonly product_title: string;
    readonly stripe_checkout_session_id: string | null;
    readonly payment_intent_id: string;
    readonly charge_id: string;
    /**
     * ID of transfer to connected account
     */
    readonly transfer_id: string;
    /**
     * Total amount paid by customer (in cents)
     */
    readonly total_amount: number;
    /**
     * Platform commission (in cents)
     */
    readonly platform_fee: number;
    /**
     * Amount transferred to seller (in cents)
     */
    readonly seller_amount: number;
    /**
     * Stripe's processing fee (in cents)
     */
    readonly stripe_processing_fee: number;
    readonly display_amount: string;
    readonly seller_payout: string;
    readonly platform_earnings: string;
    readonly currency: string;
    readonly status: PaymentTransactionStatusEnum;
    /**
     * Status of transfer to seller
     */
    readonly transfer_status: string;
    customer_email?: string;
    /**
     * Amount refunded to customer (in cents)
     */
    readonly refunded_amount: number;
    /**
     * Platform fee refunded (in cents)
     */
    readonly platform_fee_refunded: number;
    metadata?: any;
    readonly created_at: string;
    readonly updated_at: string;
    readonly paid_at: string | null;
    readonly transferred_at: string | null;
};

