/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommentReplyListStatusEnum } from './CommentReplyListStatusEnum';
/**
 * Simplified serializer for listing comment replies.
 */
export type CommentReplyList = {
    readonly id: number;
    reply_text: string;
    status?: CommentReplyListStatusEnum;
    readonly sent_at: string;
    readonly rule_name: string;
    readonly comment_message: string;
    readonly comment_from_user: string;
    readonly page_name: string;
};

