/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedSocialMediaPostListList } from '../models/PaginatedSocialMediaPostListList';
import type { PatchedSocialMediaPost } from '../models/PatchedSocialMediaPost';
import type { SocialMediaPost } from '../models/SocialMediaPost';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PostsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List all posts for the authenticated user or create a new post
     * @param page A page number within the paginated result set.
     * @returns PaginatedSocialMediaPostListList
     * @throws ApiError
     */
    public postsList(
        page?: number,
    ): CancelablePromise<PaginatedSocialMediaPostListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/posts/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * List all posts for the authenticated user or create a new post
     * @param formData
     * @returns SocialMediaPost
     * @throws ApiError
     */
    public postsCreate(
        formData: SocialMediaPost,
    ): CancelablePromise<SocialMediaPost> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Retrieve, update, or delete a specific post
     * @param id
     * @returns SocialMediaPost
     * @throws ApiError
     */
    public postsRetrieve(
        id: number,
    ): CancelablePromise<SocialMediaPost> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/posts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Retrieve, update, or delete a specific post
     * @param id
     * @param formData
     * @returns SocialMediaPost
     * @throws ApiError
     */
    public postsUpdate(
        id: number,
        formData: SocialMediaPost,
    ): CancelablePromise<SocialMediaPost> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/posts/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Retrieve, update, or delete a specific post
     * @param id
     * @param formData
     * @returns SocialMediaPost
     * @throws ApiError
     */
    public postsPartialUpdate(
        id: number,
        formData?: PatchedSocialMediaPost,
    ): CancelablePromise<SocialMediaPost> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/posts/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Retrieve, update, or delete a specific post
     * @param id
     * @returns void
     * @throws ApiError
     */
    public postsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/posts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Duplicate an existing post
     * @param postId
     * @returns any No response body
     * @throws ApiError
     */
    public postsDuplicateCreate(
        postId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts/{post_id}/duplicate/',
            path: {
                'post_id': postId,
            },
        });
    }
    /**
     * Immediately publish a draft or scheduled post
     * @param postId
     * @returns any No response body
     * @throws ApiError
     */
    public postsPublishCreate(
        postId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts/{post_id}/publish/',
            path: {
                'post_id': postId,
            },
        });
    }
    /**
     * Update the status of a specific post
     * @param postId
     * @returns any No response body
     * @throws ApiError
     */
    public postsStatusCreate(
        postId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts/{post_id}/status/',
            path: {
                'post_id': postId,
            },
        });
    }
    /**
     * Create posts for multiple connections at once
     * @returns any No response body
     * @throws ApiError
     */
    public postsBulkCreateCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts/bulk-create/',
        });
    }
    /**
     * Get all scheduled posts for the next 30 days
     * @returns any No response body
     * @throws ApiError
     */
    public postsScheduledRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/posts/scheduled/',
        });
    }
    /**
     * Get statistics about user's posts
     * @returns any No response body
     * @throws ApiError
     */
    public postsStatsRetrieve(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/posts/stats/',
        });
    }
}
