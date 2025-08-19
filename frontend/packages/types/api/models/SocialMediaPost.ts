/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SocialMediaConnection } from './SocialMediaConnection';
import type { StatusD18Enum } from './StatusD18Enum';
/**
 * Serializer for creating and managing social media posts
 */
export type SocialMediaPost = {
    readonly id: number;
    /**
     * List of SocialMediaConnection IDs to publish to
     */
    connection_ids: Array<number>;
    readonly connection: SocialMediaConnection;
    readonly platform_name: string;
    text: string;
    media_urls?: any;
    status?: StatusD18Enum;
    scheduled_at?: string | null;
    readonly sent_at: string | null;
    readonly platform_post_id: string;
    readonly platform_post_url: string;
    error_message?: string;
    readonly created_at: string;
    readonly modified_at: string;
};

