/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Plan } from './Plan';
import type { SubscriptionStatusEnum } from './SubscriptionStatusEnum';
export type Subscription = {
    readonly id: number;
    readonly plan: Plan;
    status?: SubscriptionStatusEnum;
    /**
     * When the trial period started
     */
    trial_start?: string | null;
    /**
     * When the trial period ends
     */
    trial_end?: string | null;
    /**
     * Whether subscription is currently in trial period
     */
    is_trialing?: boolean;
    current_period_start?: string | null;
    current_period_end?: string | null;
    canceled_at?: string | null;
    readonly created_at: string;
};

