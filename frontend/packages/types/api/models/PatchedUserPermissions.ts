/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedUserPermissions = {
    readonly id?: number;
    user?: number;
    /**
     * Dashboard section access
     */
    can_access_overview?: boolean;
    /**
     * Storefront, Custom Links, CTA Banners
     */
    can_access_linkinbio?: boolean;
    /**
     * Calendar, Post Creator, Content Library, Social Accounts
     */
    can_access_content?: boolean;
    /**
     * Comments, Automation Rules, Settings, Analytics
     */
    can_access_automation?: boolean;
    /**
     * AI Assistant and related tools
     */
    can_access_ai_tools?: boolean;
    /**
     * Subscription and billing management
     */
    can_access_business?: boolean;
    /**
     * Account settings and profile
     */
    can_access_account?: boolean;
    /**
     * Edit user profile and settings
     */
    can_edit_profile?: boolean;
    /**
     * Connect/disconnect social media accounts
     */
    can_manage_integrations?: boolean;
    /**
     * View performance analytics and stats
     */
    can_view_analytics?: boolean;
    readonly accessible_sections?: string;
    readonly created_at?: string;
    readonly modified_at?: string;
};

