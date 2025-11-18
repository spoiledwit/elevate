/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransactionTypeEnum } from './TransactionTypeEnum';
/**
 * Serializer for credit transactions
 */
export type CreditTransaction = {
    readonly id: number;
    readonly user: number;
    readonly user_email: string;
    readonly username: string;
    transaction_type: TransactionTypeEnum;
    readonly transaction_type_display: string;
    /**
     * Positive for credits added, negative for credits used
     */
    amount: string;
    /**
     * Credit balance after this transaction
     */
    readonly balance_after: string;
    description?: string;
    /**
     * Link to payment if this is a purchase
     */
    payment_transaction?: number | null;
    /**
     * Link to Milo call if this is usage
     */
    milo_call_log?: number | null;
    readonly created_at: string;
};

