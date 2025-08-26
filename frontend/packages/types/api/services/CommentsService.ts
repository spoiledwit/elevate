/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CommentsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get comments for a specific Facebook post.
     * @returns any No response body
     * @throws ApiError
     */
    public commentsRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comments/',
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
