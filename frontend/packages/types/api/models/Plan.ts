/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingPeriodEnum } from './BillingPeriodEnum';
import type { PlanFeature } from './PlanFeature';
export type Plan = {
    readonly id: number;
    /**
     * Display name for the plan
     */
    name: string;
    /**
     * URL-friendly identifier
     */
    slug: string;
    /**
     * Description of what this plan includes
     */
    description?: string;
    /**
     * Price in USD
     */
    price: string;
    billing_period?: BillingPeriodEnum;
    /**
     * Number of days for free trial
     */
    trial_period_days?: number;
    /**
     * Whether this plan is available for new subscriptions
     */
    is_active?: boolean;
    /**
     * Highlight this plan in pricing display
     */
    is_featured?: boolean;
    /**
     * Display order (lower numbers first)
     */
    sort_order?: number;
    readonly features: Array<PlanFeature>;
};

