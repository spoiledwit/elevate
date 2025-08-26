/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for comment automation rules.
 */
export type CommentAutomationRule = {
    readonly id: number;
    rule_name: string;
    keywords?: any;
    reply_template: string;
    is_active?: boolean;
    priority?: number;
    readonly connection_name: string;
    readonly times_triggered: number;
    readonly created_at: string;
};

