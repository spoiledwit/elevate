/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomLink } from './CustomLink';
/**
 * Serializer for profile analytics data.
 */
export type ProfileAnalytics = {
    profile_id: number;
    total_views: number;
    total_clicks: number;
    date_range: Record<string, any>;
    top_links: Array<CustomLink>;
    daily_views?: Array<Record<string, any>>;
};

