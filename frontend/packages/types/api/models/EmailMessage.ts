/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailAttachment } from './EmailAttachment';
/**
 * Serializer for email messages
 */
export type EmailMessage = {
    readonly id: number;
    account: number;
    readonly account_email: string;
    /**
     * Gmail message ID
     */
    readonly message_id: string;
    readonly thread_id: string;
    from_email: string;
    from_name?: string;
    to_emails?: any;
    cc_emails?: any;
    subject?: string;
    body_text?: string;
    body_html?: string;
    /**
     * Email preview text
     */
    snippet?: string;
    readonly received_at: string;
    is_read?: boolean;
    is_starred?: boolean;
    has_attachments?: boolean;
    readonly has_attachments_count: string;
    labels?: any;
    readonly attachments: Array<EmailAttachment>;
    readonly created_at: string;
};

