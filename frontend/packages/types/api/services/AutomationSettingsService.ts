/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedCommentAutomationSettingsList } from '../models/PaginatedCommentAutomationSettingsList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AutomationSettingsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List automation settings for user's Facebook connections.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCommentAutomationSettingsList
     * @throws ApiError
     */
    public automationSettingsList(
        page?: number,
    ): CancelablePromise<PaginatedCommentAutomationSettingsList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/automation-settings/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Get or create/update automation settings for a specific connection.
     * @param connectionId
     * @returns any No response body
     * @throws ApiError
     */
    public automationSettingsRetrieve(
        connectionId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/automation-settings/{connection_id}/',
            path: {
                'connection_id': connectionId,
            },
        });
    }
    /**
     * Get or create/update automation settings for a specific connection.
     * @param connectionId
     * @returns any No response body
     * @throws ApiError
     */
    public automationSettingsCreate(
        connectionId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/automation-settings/{connection_id}/',
            path: {
                'connection_id': connectionId,
            },
        });
    }
    /**
     * Delete automation settings by ID.
     * @param settingsId
     * @returns void
     * @throws ApiError
     */
    public automationSettingsDeleteDestroy(
        settingsId: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/automation-settings/{settings_id}/delete/',
            path: {
                'settings_id': settingsId,
            },
        });
    }
    /**
     * Toggle automation settings enabled/disabled status.
     * @param settingsId
     * @returns any No response body
     * @throws ApiError
     */
    public automationSettingsToggleCreate(
        settingsId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/automation-settings/{settings_id}/toggle/',
            path: {
                'settings_id': settingsId,
            },
        });
    }
    /**
     * Update automation settings by ID.
     * @param settingsId
     * @returns any No response body
     * @throws ApiError
     */
    public automationSettingsUpdatePartialUpdate(
        settingsId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/automation-settings/{settings_id}/update/',
            path: {
                'settings_id': settingsId,
            },
        });
    }
}
