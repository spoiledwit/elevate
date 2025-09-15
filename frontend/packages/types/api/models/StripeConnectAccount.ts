/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for StripeConnectAccount model
 */
export type StripeConnectAccount = {
    readonly id: number;
    readonly stripe_account_id: string;
    readonly status: string;
    readonly is_active: boolean;
    /**
     * Whether the account can create charges
     */
    readonly charges_enabled: boolean;
    /**
     * Whether Stripe can send payouts to the account
     */
    readonly payouts_enabled: boolean;
    /**
     * Whether account details have been submitted
     */
    readonly details_submitted: boolean;
    /**
     * Two-letter country code
     */
    readonly country: string;
    readonly default_currency: string;
    email?: string;
    /**
     * Percentage of each transaction kept as platform fee
     */
    platform_fee_percentage?: string;
    readonly onboarding_completed_at: string | null;
    /**
     * Currently due requirements for the account
     */
    readonly requirements_due: any;
    /**
     * Requirements that need to be fixed
     */
    readonly requirements_errors: any;
    readonly created_at: string;
    readonly updated_at: string;
};

