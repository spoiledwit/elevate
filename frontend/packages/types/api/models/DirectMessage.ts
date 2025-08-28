/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlatformA50Enum } from './PlatformA50Enum';
import type { Status28aEnum } from './Status28aEnum';
/**
 * Detailed serializer for direct messages.
 */
export type DirectMessage = {
    readonly id: number;
    message_id: string;
    conversation_id: string;
    platform: PlatformA50Enum;
    readonly platform_display: string;
    sender_id: string;
    sender_name?: string;
    message_text?: string;
    message_attachments?: any;
    connection: number;
    readonly connection_name: string;
    status?: Status28aEnum;
    /**
     * Message sent by the page itself
     */
    is_echo?: boolean;
    created_time: string;
    readonly received_at: string;
};

