/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating comment automation rules.
 */
export type CommentAutomationRuleCreate = {
    rule_name: string;
    keywords?: any;
    reply_template: string;
    is_active?: boolean;
    priority?: number;
    connection_id: number;
};

