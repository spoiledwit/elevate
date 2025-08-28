/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for automation settings.
 */
export type AutomationSettings = {
    readonly id: number;
    connection: number;
    readonly connection_name: string;
    readonly platform_name: string;
    is_enabled?: boolean;
    default_reply?: string;
    reply_delay_seconds?: number;
    enable_dm_automation?: boolean;
    dm_default_reply?: string;
    dm_reply_delay_seconds?: number;
    readonly created_at: string;
    readonly updated_at: string;
};

