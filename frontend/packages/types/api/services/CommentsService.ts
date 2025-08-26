/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Comment } from '../models/Comment';
import type { PaginatedCommentListList } from '../models/PaginatedCommentListList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CommentsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List comments for authenticated user's Facebook pages.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCommentListList
     * @throws ApiError
     */
    public commentsList(
        page?: number,
    ): CancelablePromise<PaginatedCommentListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Get all replies for a specific comment.
     * @param commentId
     * @returns any No response body
     * @throws ApiError
     */
    public commentsRepliesRetrieve(
        commentId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/{comment_id}/replies/',
            path: {
                'comment_id': commentId,
            },
        });
    }
    /**
     * Get details of a specific comment.
     * @param id
     * @returns Comment
     * @throws ApiError
     */
    public commentsRetrieve(
        id: number,
    ): CancelablePromise<Comment> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get comments for a specific Facebook post.
     * @returns any No response body
     * @throws ApiError
     */
    public commentsGetPostCommentsRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/get-post-comments/',
        });
    }
    /**
     * List all Facebook pages connected by the user.
     * @returns any No response body
     * @throws ApiError
     */
    public commentsPagesRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/pages/',
        });
    }
    /**
     * Reply to a Facebook comment manually.
     * @returns any No response body
     * @throws ApiError
     */
    public commentsReplyCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/comments/reply/',
        });
    }
    /**
     * Subscribe a Facebook page to webhooks for comment automation.
     * @returns any No response body
     * @throws ApiError
     */
    public commentsSubscribeWebhooksCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/comments/subscribe-webhooks/',
        });
    }
}
