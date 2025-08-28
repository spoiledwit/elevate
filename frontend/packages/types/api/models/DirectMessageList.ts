/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlatformA50Enum } from './PlatformA50Enum';
import type { Status28aEnum } from './Status28aEnum';
/**
 * Simplified serializer for listing direct messages.
 */
export type DirectMessageList = {
    readonly id: number;
    message_id: string;
    conversation_id: string;
    platform: PlatformA50Enum;
    readonly platform_display: string;
    sender_name?: string;
    message_text?: string;
    readonly connection_name: string;
    status?: Status28aEnum;
    created_time: string;
    readonly replies_count: string;
};

