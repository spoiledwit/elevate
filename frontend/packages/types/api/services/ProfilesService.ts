/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedUserProfileList } from '../models/PaginatedUserProfileList';
import type { UserProfilePublic } from '../models/UserProfilePublic';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ProfilesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserProfileList
     * @throws ApiError
     */
    public profilesList(
        page?: number,
    ): CancelablePromise<PaginatedUserProfileList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * @param slug
     * @returns UserProfilePublic
     * @throws ApiError
     */
    public profilesRetrieve(
        slug: string,
    ): CancelablePromise<UserProfilePublic> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/{slug}/',
            path: {
                'slug': slug,
            },
            errors: {
                404: `No response body`,
            },
        });
    }
}
