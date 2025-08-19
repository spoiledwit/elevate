/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PlanFeature = {
    readonly id: number;
    /**
     * Technical key for feature (e.g., 'max_audits', 'has_priority_support')
     */
    feature_key: string;
    /**
     * Human-readable feature name
     */
    feature_name: string;
    /**
     * Feature value (e.g., '10', 'unlimited', 'true')
     */
    feature_value: string;
    /**
     * Show this feature prominently in pricing
     */
    is_highlight?: boolean;
    sort_order?: number;
};

