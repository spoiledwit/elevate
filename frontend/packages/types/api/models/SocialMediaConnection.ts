/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Generic serializer for social media connections
 */
export type SocialMediaConnection = {
    readonly id: number;
    readonly platform_name: string;
    readonly platform_display_name: string;
    platform_username?: string;
    platform_profile_url?: string;
    instagram_username?: string;
    facebook_page_name?: string;
    pinterest_user_id?: string;
    is_active?: boolean;
    is_verified?: boolean;
};

