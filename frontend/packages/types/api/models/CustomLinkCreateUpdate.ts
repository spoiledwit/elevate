/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StyleEnum } from './StyleEnum';
/**
 * Serializer for creating and updating custom links.
 * Used in storefront management APIs.
 */
export type CustomLinkCreateUpdate = {
    order?: number;
    is_active?: boolean;
    /**
     * Product type (e.g., 'generic', 'digital_product', 'service', 'event', 'subscription')
     */
    type?: string;
    thumbnail?: string | null;
    title?: string;
    subtitle?: string;
    button_text?: string;
    style?: StyleEnum;
    checkout_image?: string | null;
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
    /**
     * List of collect info fields to create for this custom link
     */
    collect_info_fields_data?: Array<Record<string, any>>;
};

