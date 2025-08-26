/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedCommentReplyListList } from '../models/PaginatedCommentReplyListList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CommentRepliesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List automated replies for user's comments.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCommentReplyListList
     * @throws ApiError
     */
    public commentRepliesList(
        page?: number,
    ): CancelablePromise<PaginatedCommentReplyListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/comment-replies/',
            query: {
                'page': page,
            },
        });
    }
}
