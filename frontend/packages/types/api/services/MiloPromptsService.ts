/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MiloPrompt } from '../models/MiloPrompt';
import type { PaginatedMiloPromptList } from '../models/PaginatedMiloPromptList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MiloPromptsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * ViewSet for fetching Milo AI prompts.
     * Read-only - prompts are managed through admin panel.
     * @param page A page number within the paginated result set.
     * @returns PaginatedMiloPromptList
     * @throws ApiError
     */
    public miloPromptsList(
        page?: number,
    ): CancelablePromise<PaginatedMiloPromptList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/milo-prompts/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for fetching Milo AI prompts.
     * Read-only - prompts are managed through admin panel.
     * @param id A unique integer value identifying this Milo Prompt.
     * @returns MiloPrompt
     * @throws ApiError
     */
    public miloPromptsRetrieve(
        id: number,
    ): CancelablePromise<MiloPrompt> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/milo-prompts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get the most recently updated prompt
     * @returns MiloPrompt
     * @throws ApiError
     */
    public miloPromptsLatestRetrieve(): CancelablePromise<MiloPrompt> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/milo-prompts/latest/',
        });
    }
}
