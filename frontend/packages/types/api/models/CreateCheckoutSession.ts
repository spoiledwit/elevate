/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating a product checkout session
 */
export type CreateCheckoutSession = {
    /**
     * ID of the product/custom link
     */
    custom_link_id: number;
    /**
     * URL to redirect to after successful payment
     */
    success_url: string;
    /**
     * URL to redirect to if payment is cancelled
     */
    cancel_url: string;
    /**
     * Pre-fill customer email
     */
    customer_email?: string;
    /**
     * Additional metadata for the checkout session
     */
    metadata?: any;
};

