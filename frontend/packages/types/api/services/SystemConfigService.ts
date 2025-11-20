/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedSystemConfigList } from '../models/PaginatedSystemConfigList';
import type { PatchedSystemConfig } from '../models/PatchedSystemConfig';
import type { SystemConfig } from '../models/SystemConfig';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemConfigService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param page A page number within the paginated result set.
     * @returns PaginatedSystemConfigList
     * @throws ApiError
     */
    public systemConfigList(
        page?: number,
    ): CancelablePromise<PaginatedSystemConfigList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/system-config/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param requestBody
     * @returns SystemConfig
     * @throws ApiError
     */
    public systemConfigCreate(
        requestBody: SystemConfig,
    ): CancelablePromise<SystemConfig> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/system-config/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param id A unique integer value identifying this System Configuration.
     * @returns SystemConfig
     * @throws ApiError
     */
    public systemConfigRetrieve(
        id: number,
    ): CancelablePromise<SystemConfig> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/system-config/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param id A unique integer value identifying this System Configuration.
     * @param requestBody
     * @returns SystemConfig
     * @throws ApiError
     */
    public systemConfigUpdate(
        id: number,
        requestBody: SystemConfig,
    ): CancelablePromise<SystemConfig> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/system-config/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param id A unique integer value identifying this System Configuration.
     * @param requestBody
     * @returns SystemConfig
     * @throws ApiError
     */
    public systemConfigPartialUpdate(
        id: number,
        requestBody?: PatchedSystemConfig,
    ): CancelablePromise<SystemConfig> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/system-config/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for fetching and updating system configuration.
     * Only one instance exists (singleton pattern).
     * @param id A unique integer value identifying this System Configuration.
     * @returns void
     * @throws ApiError
     */
    public systemConfigDestroy(
        id: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/system-config/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get the current system configuration
     * @returns SystemConfig
     * @throws ApiError
     */
    public systemConfigCurrentRetrieve(): CancelablePromise<SystemConfig> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/system-config/current/',
        });
    }
}
