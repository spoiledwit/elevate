/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LinkedInAuthUrl } from '../models/LinkedInAuthUrl';
import type { LinkedInConnectionsList } from '../models/LinkedInConnectionsList';
import type { LinkedInDisconnectResponse } from '../models/LinkedInDisconnectResponse';
import type { LinkedInPublishPost } from '../models/LinkedInPublishPost';
import type { LinkedInPublishResponse } from '../models/LinkedInPublishResponse';
import type { MetaAuthUrl } from '../models/MetaAuthUrl';
import type { MetaConnectionsList } from '../models/MetaConnectionsList';
import type { MetaDisconnectResponse } from '../models/MetaDisconnectResponse';
import type { MetaPublishPost } from '../models/MetaPublishPost';
import type { MetaPublishResponse } from '../models/MetaPublishResponse';
import type { PinterestAuthUrl } from '../models/PinterestAuthUrl';
import type { PinterestConnectionsList } from '../models/PinterestConnectionsList';
import type { PinterestDisconnectResponse } from '../models/PinterestDisconnectResponse';
import type { PinterestPublishPost } from '../models/PinterestPublishPost';
import type { PinterestPublishResponse } from '../models/PinterestPublishResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class IntegrationsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Generate OAuth authorization URL for connecting LinkedIn personal profiles
     * @returns LinkedInAuthUrl
     * @throws ApiError
     */
    public integrationsLinkedinAuthRetrieve(): CancelablePromise<LinkedInAuthUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/linkedin/auth/',
        });
    }
    /**
     * Process OAuth callback and create account connections
     * @returns any
     * @throws ApiError
     */
    public integrationsLinkedinCallbackRetrieve(): CancelablePromise<{
        success?: boolean;
        connections_created?: number;
        accounts?: Array<Record<string, any>>;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/linkedin/callback/',
        });
    }
    /**
     * Get all connected LinkedIn accounts for the current user
     * @returns LinkedInConnectionsList
     * @throws ApiError
     */
    public integrationsLinkedinConnectionsRetrieve(): CancelablePromise<LinkedInConnectionsList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/linkedin/connections/',
        });
    }
    /**
     * Disconnect a LinkedIn account
     * @param connectionId
     * @returns LinkedInDisconnectResponse
     * @throws ApiError
     */
    public integrationsLinkedinDisconnectDestroy(
        connectionId: number,
    ): CancelablePromise<LinkedInDisconnectResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/integrations/linkedin/disconnect/{connection_id}/',
            path: {
                'connection_id': connectionId,
            },
        });
    }
    /**
     * Create a post on LinkedIn personal profile
     * @param requestBody
     * @returns LinkedInPublishResponse
     * @throws ApiError
     */
    public integrationsLinkedinPublishCreate(
        requestBody: LinkedInPublishPost,
    ): CancelablePromise<LinkedInPublishResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/integrations/linkedin/publish/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate OAuth authorization URL for connecting Facebook/Instagram accounts
     * @returns MetaAuthUrl
     * @throws ApiError
     */
    public integrationsMetaAuthRetrieve(): CancelablePromise<MetaAuthUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/meta/auth/',
        });
    }
    /**
     * Process OAuth callback and create account connections
     * @returns any
     * @throws ApiError
     */
    public integrationsMetaCallbackRetrieve(): CancelablePromise<{
        success?: boolean;
        connections_created?: number;
        accounts?: Array<Record<string, any>>;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/meta/callback/',
        });
    }
    /**
     * Get all connected Facebook/Instagram accounts for the current user
     * @returns MetaConnectionsList
     * @throws ApiError
     */
    public integrationsMetaConnectionsRetrieve(): CancelablePromise<MetaConnectionsList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/meta/connections/',
        });
    }
    /**
     * Disconnect a Facebook or Instagram account
     * @param connectionId
     * @returns MetaDisconnectResponse
     * @throws ApiError
     */
    public integrationsMetaDisconnectDestroy(
        connectionId: number,
    ): CancelablePromise<MetaDisconnectResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/integrations/meta/disconnect/{connection_id}/',
            path: {
                'connection_id': connectionId,
            },
        });
    }
    /**
     * Publish content to Facebook or Instagram
     * @param requestBody
     * @returns MetaPublishResponse
     * @throws ApiError
     */
    public integrationsMetaPublishCreate(
        requestBody: MetaPublishPost,
    ): CancelablePromise<MetaPublishResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/integrations/meta/publish/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate OAuth authorization URL for connecting Pinterest accounts
     * @returns PinterestAuthUrl
     * @throws ApiError
     */
    public integrationsPinterestAuthRetrieve(): CancelablePromise<PinterestAuthUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/pinterest/auth/',
        });
    }
    /**
     * Process OAuth callback and create account connections
     * @returns any
     * @throws ApiError
     */
    public integrationsPinterestCallbackRetrieve(): CancelablePromise<{
        success?: boolean;
        connections_created?: number;
        accounts?: Array<Record<string, any>>;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/pinterest/callback/',
        });
    }
    /**
     * Get all connected Pinterest accounts for the current user
     * @returns PinterestConnectionsList
     * @throws ApiError
     */
    public integrationsPinterestConnectionsRetrieve(): CancelablePromise<PinterestConnectionsList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/pinterest/connections/',
        });
    }
    /**
     * Disconnect a Pinterest account
     * @param connectionId
     * @returns PinterestDisconnectResponse
     * @throws ApiError
     */
    public integrationsPinterestDisconnectDestroy(
        connectionId: number,
    ): CancelablePromise<PinterestDisconnectResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/integrations/pinterest/disconnect/{connection_id}/',
            path: {
                'connection_id': connectionId,
            },
        });
    }
    /**
     * Create a pin on Pinterest
     * @param requestBody
     * @returns PinterestPublishResponse
     * @throws ApiError
     */
    public integrationsPinterestPublishCreate(
        requestBody: PinterestPublishPost,
    ): CancelablePromise<PinterestPublishResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/integrations/pinterest/publish/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get connection status for all social media platforms for the current user
     * @returns any
     * @throws ApiError
     */
    public integrationsPlatformsStatusRetrieve(): CancelablePromise<{
        platforms?: Array<{
            name?: string;
            display_name?: string;
            connected?: boolean;
            connection_count?: number;
            connections?: Array<Record<string, any>>;
        }>;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/integrations/platforms/status/',
        });
    }
}
