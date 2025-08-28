/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageTypeEnum } from './MessageTypeEnum';
/**
 * Serializer for creating automation rules.
 */
export type AutomationRuleCreate = {
    rule_name: string;
    message_type?: MessageTypeEnum;
    keywords?: any;
    reply_template: string;
    is_active?: boolean;
    priority?: number;
    connection_id: number;
};

