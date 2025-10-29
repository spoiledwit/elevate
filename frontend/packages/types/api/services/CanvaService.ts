/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CanvaAuthUrl } from '../models/CanvaAuthUrl';
import type { CanvaCallback } from '../models/CanvaCallback';
import type { CanvaCallbackResponse } from '../models/CanvaCallbackResponse';
import type { CanvaConnectionStatus } from '../models/CanvaConnectionStatus';
import type { CanvaCreateDesign } from '../models/CanvaCreateDesign';
import type { CanvaDesign } from '../models/CanvaDesign';
import type { CanvaDesignList } from '../models/CanvaDesignList';
import type { CanvaDesignResponse } from '../models/CanvaDesignResponse';
import type { CanvaExport } from '../models/CanvaExport';
import type { CanvaExportResponse } from '../models/CanvaExportResponse';
import type { PatchedCanvaDesign } from '../models/PatchedCanvaDesign';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class CanvaService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Generate OAuth authorization URL for connecting to Canva with PKCE
     * @returns CanvaAuthUrl
     * @throws ApiError
     */
    public canvaAuthRetrieve(): CancelablePromise<CanvaAuthUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/canva/auth/',
        });
    }
    /**
     * Handle Canva OAuth callback and exchange code for access token
     * @param requestBody
     * @returns CanvaCallbackResponse
     * @throws ApiError
     */
    public canvaCallbackCreate(
        requestBody: CanvaCallback,
    ): CancelablePromise<CanvaCallbackResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/canva/callback/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a new design in Canva and get the edit URL
     * @param requestBody
     * @returns CanvaDesignResponse
     * @throws ApiError
     */
    public canvaCreateDesignCreate(
        requestBody?: CanvaCreateDesign,
    ): CancelablePromise<CanvaDesignResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/canva/create-design/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get list of all Canva designs for the user
     * @returns CanvaDesignList
     * @throws ApiError
     */
    public canvaDesignsList(): CancelablePromise<Array<CanvaDesignList>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/canva/designs/',
        });
    }
    /**
     * Get details of a specific Canva design
     * @param designId
     * @returns CanvaDesign
     * @throws ApiError
     */
    public canvaDesignsRetrieve(
        designId: string,
    ): CancelablePromise<CanvaDesign> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/canva/designs/{design_id}/',
            path: {
                'design_id': designId,
            },
        });
    }
    /**
     * Update a Canva design (title, status, etc.)
     * @param designId
     * @param requestBody
     * @returns CanvaDesign
     * @throws ApiError
     */
    public canvaDesignsPartialUpdate(
        designId: string,
        requestBody?: PatchedCanvaDesign,
    ): CancelablePromise<CanvaDesign> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/canva/designs/{design_id}/',
            path: {
                'design_id': designId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a Canva design from the database
     * @param designId
     * @returns void
     * @throws ApiError
     */
    public canvaDesignsDestroy(
        designId: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/canva/designs/{design_id}/',
            path: {
                'design_id': designId,
            },
        });
    }
    /**
     * Export a Canva design and get the download URL
     * @param requestBody
     * @returns CanvaExportResponse
     * @throws ApiError
     */
    public canvaExportCreate(
        requestBody?: CanvaExport,
    ): CancelablePromise<CanvaExportResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/canva/export/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Check if user is connected to Canva
     * @returns CanvaConnectionStatus
     * @throws ApiError
     */
    public canvaStatusRetrieve(): CancelablePromise<CanvaConnectionStatus> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/canva/status/',
        });
    }
}
