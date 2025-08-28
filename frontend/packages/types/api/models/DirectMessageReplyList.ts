/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DirectMessageReplyListStatusEnum } from './DirectMessageReplyListStatusEnum';
/**
 * Simplified serializer for listing direct message replies.
 */
export type DirectMessageReplyList = {
    readonly id: number;
    reply_text: string;
    status?: DirectMessageReplyListStatusEnum;
    readonly sent_at: string;
    readonly rule_name: string;
    readonly message_text: string;
    readonly sender_name: string;
    readonly platform: string;
    readonly platform_display: string;
    readonly connection_name: string;
};

