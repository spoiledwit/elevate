/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Lightweight serializer for listing emails
 */
export type EmailMessageList = {
    readonly id: number;
    readonly account_email: string;
    /**
     * Gmail message ID
     */
    readonly message_id: string;
    from_email: string;
    from_name?: string;
    subject?: string;
    /**
     * Email preview text
     */
    snippet?: string;
    readonly received_at: string;
    is_read?: boolean;
    is_starred?: boolean;
    has_attachments?: boolean;
    labels?: any;
};

