/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating a new Connect account
 */
export type CreateConnectAccount = {
    /**
     * Email for the Stripe account
     */
    email?: string;
    /**
     * ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA', 'GB'). Defaults to 'US' if not provided.
     */
    country?: string;
};

