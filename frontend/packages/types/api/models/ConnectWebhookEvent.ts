/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Connect webhook events
 */
export type ConnectWebhookEvent = {
    readonly id: number;
    stripe_event_id: string;
    event_type: string;
    /**
     * Connected account ID if applicable
     */
    account_id?: string | null;
    readonly account_username: string | null;
    readonly transaction_order_id: string | null;
    processed?: boolean;
    error_message?: string;
    readonly created_at: string;
    processed_at?: string | null;
};

