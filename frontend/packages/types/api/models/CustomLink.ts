/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CollectInfoField } from './CollectInfoField';
import type { CollectInfoResponse } from './CollectInfoResponse';
import type { StyleEnum } from './StyleEnum';
export type CustomLink = {
    readonly id: number;
    order?: number;
    is_active?: boolean;
    /**
     * Product type (e.g., 'generic', 'digital_product', 'service', 'event', 'subscription')
     */
    type?: string;
    readonly click_count: number;
    readonly created_at: string;
    readonly modified_at: string;
    readonly thumbnail: string;
    title?: string;
    subtitle?: string;
    button_text?: string;
    style?: StyleEnum;
    readonly checkout_image: string;
    checkout_title?: string;
    checkout_description?: string;
    checkout_bottom_title?: string;
    checkout_cta_button_text?: string;
    checkout_price?: string | null;
    checkout_discounted_price?: string | null;
    /**
     * Product-specific information based on product type
     */
    additional_info?: any;
    readonly collect_info_fields: Array<CollectInfoField>;
    readonly collect_info_responses: Array<CollectInfoResponse>;
};

