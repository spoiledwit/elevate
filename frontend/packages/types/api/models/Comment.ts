/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusC26Enum } from './StatusC26Enum';
/**
 * Serializer for displaying received Facebook comments.
 */
export type Comment = {
    readonly id: number;
    comment_id: string;
    post_id: string;
    page_id: string;
    readonly facebook_page_id: string;
    from_user_name: string;
    from_user_id?: string;
    message: string;
    status?: StatusC26Enum;
    readonly connection_name: string;
    readonly platform_name: string;
    created_time: string;
    readonly received_at: string;
};

