/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedDirectMessageReplyListList } from '../models/PaginatedDirectMessageReplyListList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DmRepliesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List automated DM replies for user's messages.
     * @param page A page number within the paginated result set.
     * @returns PaginatedDirectMessageReplyListList
     * @throws ApiError
     */
    public dmRepliesList(
        page?: number,
    ): CancelablePromise<PaginatedDirectMessageReplyListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/dm-replies/',
            query: {
                'page': page,
            },
        });
    }
}
