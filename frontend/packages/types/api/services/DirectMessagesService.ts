/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DirectMessage } from '../models/DirectMessage';
import type { PaginatedDirectMessageListList } from '../models/PaginatedDirectMessageListList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DirectMessagesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List direct messages for authenticated user's Facebook/Instagram connections.
     * @param page A page number within the paginated result set.
     * @returns PaginatedDirectMessageListList
     * @throws ApiError
     */
    public directMessagesList(
        page?: number,
    ): CancelablePromise<PaginatedDirectMessageListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/direct-messages/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Get all replies for a specific direct message.
     * @param messageId
     * @returns any No response body
     * @throws ApiError
     */
    public directMessagesRepliesRetrieve(
        messageId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/direct-messages/{message_id}/replies/',
            path: {
                'message_id': messageId,
            },
        });
    }
    /**
     * Get details of a specific direct message.
     * @param id
     * @returns DirectMessage
     * @throws ApiError
     */
    public directMessagesRetrieve(
        id: number,
    ): CancelablePromise<DirectMessage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/direct-messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Reply to a Facebook/Instagram direct message manually.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public directMessagesReplyCreate(
        requestBody?: {
            /**
             * Platform message ID to reply to
             */
            message_id: string;
            /**
             * Reply message text
             */
            message: string;
            /**
             * Connection ID
             */
            connection_id: number;
        },
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
        /**
         * Platform reply ID
         */
        reply_id?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/direct-messages/reply/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
