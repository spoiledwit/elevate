/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Connect account status
 */
export type ConnectAccountStatus = {
    account_id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    country: string;
    default_currency: string;
    is_active: boolean;
    requirements?: any;
    business_profile?: any;
};

