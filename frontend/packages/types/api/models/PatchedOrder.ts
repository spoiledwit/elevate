/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderStatusEnum } from './OrderStatusEnum';
/**
 * Serializer for Order model to handle digital product purchases.
 */
export type PatchedOrder = {
    readonly id?: number;
    readonly order_id?: string;
    status?: OrderStatusEnum;
    custom_link?: number;
    customer_email?: string;
    customer_name?: string;
    /**
     * JSON object with field_label: response mappings
     */
    form_responses?: any;
    readonly formatted_responses?: string;
    email_automation_enabled?: boolean;
    readonly product_title?: string;
    readonly product_subtitle?: string;
    readonly product_thumbnail?: string;
    readonly checkout_price?: string;
    readonly checkout_discounted_price?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

