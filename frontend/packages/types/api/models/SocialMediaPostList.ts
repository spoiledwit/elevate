/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusD18Enum } from './StatusD18Enum';
/**
 * Simplified serializer for listing posts
 */
export type SocialMediaPostList = {
    readonly id: number;
    readonly platform_name: string;
    readonly platform_username: string;
    text: string;
    media_urls?: any;
    status?: StatusD18Enum;
    scheduled_at?: string | null;
    sent_at?: string | null;
    readonly created_at: string;
};

