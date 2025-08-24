/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating and updating custom links.
 * Used in storefront management APIs.
 */
export type CustomLinkCreateUpdate = {
    text: string;
    url: string;
    thumbnail?: string | null;
    order?: number;
    is_active?: boolean;
};

