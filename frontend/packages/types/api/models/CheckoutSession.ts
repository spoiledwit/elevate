/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CheckoutSession = {
    /**
     * ID of the plan to subscribe to
     */
    plan_id: number;
    /**
     * URL to redirect after successful checkout
     */
    success_url?: string;
    /**
     * URL to redirect if checkout is canceled
     */
    cancel_url?: string;
};

