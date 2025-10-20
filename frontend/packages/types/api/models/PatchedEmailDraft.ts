/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for email drafts
 */
export type PatchedEmailDraft = {
    readonly id?: number;
    account?: number;
    readonly account_email?: string;
    to_emails?: any;
    cc_emails?: any;
    bcc_emails?: any;
    subject?: string;
    body_html?: string;
    /**
     * List of attachment file URLs
     */
    attachments?: any;
    readonly created_at?: string;
    readonly modified_at?: string;
};

