/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for sending emails
 */
export type EmailSend = {
    account_id: number;
    /**
     * List of recipient email addresses
     */
    to_emails: Array<string>;
    /**
     * List of CC email addresses
     */
    cc_emails?: Array<string>;
    /**
     * List of BCC email addresses
     */
    bcc_emails?: Array<string>;
    subject: string;
    /**
     * HTML body content
     */
    body_html: string;
    /**
     * List of attachment dicts with 'filename' and 'content'
     */
    attachments?: Array<Record<string, any>>;
};

