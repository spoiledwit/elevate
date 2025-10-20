/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for email attachments
 */
export type EmailAttachment = {
    readonly id: number;
    /**
     * Gmail attachment ID
     */
    readonly attachment_id: string;
    filename: string;
    content_type: string;
    /**
     * File size in bytes
     */
    size: number;
    readonly file_url: string;
    readonly created_at: string;
};

