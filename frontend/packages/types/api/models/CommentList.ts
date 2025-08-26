/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusC26Enum } from './StatusC26Enum';
/**
 * Simplified serializer for listing comments.
 */
export type CommentList = {
    readonly id: number;
    comment_id: string;
    from_user_name: string;
    message: string;
    status?: StatusC26Enum;
    readonly connection_name: string;
    created_time: string;
    readonly replies_count: string;
};

