/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageTypeEnum } from './MessageTypeEnum';
/**
 * Serializer for automation rules (comments and DMs).
 */
export type AutomationRule = {
    readonly id: number;
    rule_name: string;
    message_type?: MessageTypeEnum;
    readonly message_type_display: string;
    keywords?: any;
    reply_template: string;
    is_active?: boolean;
    priority?: number;
    readonly times_triggered: number;
    readonly created_at: string;
    connection: number;
    readonly connection_name: string;
    readonly platform_name: string;
};

