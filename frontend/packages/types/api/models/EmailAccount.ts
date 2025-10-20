/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for email accounts
 */
export type EmailAccount = {
    readonly id: number;
    readonly user: number;
    readonly username: string;
    readonly user_email: string;
    email_address: string;
    is_active?: boolean;
    readonly last_synced: string | null;
    readonly token_expiry: string | null;
    readonly created_at: string;
    readonly modified_at: string;
};

