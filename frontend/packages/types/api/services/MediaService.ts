/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkDelete } from '../models/BulkDelete';
import type { Folder } from '../models/Folder';
import type { Media } from '../models/Media';
import type { PaginatedFolderList } from '../models/PaginatedFolderList';
import type { PatchedFolder } from '../models/PatchedFolder';
import type { PatchedMedia } from '../models/PatchedMedia';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MediaService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List all media files for the authenticated user with optional folder filtering
     * @returns Media
     * @throws ApiError
     */
    public mediaList(): CancelablePromise<Array<Media>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/media/',
        });
    }
    /**
     * Upload a new media file to Cloudinary
     * @param formData
     * @returns Media
     * @throws ApiError
     */
    public mediaCreate(
        formData?: any,
    ): CancelablePromise<Media> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/media/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Retrieve a media file
     * @param id
     * @returns Media
     * @throws ApiError
     */
    public mediaRetrieve(
        id: number,
    ): CancelablePromise<Media> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/media/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a media file
     * @param id
     * @param requestBody
     * @returns Media
     * @throws ApiError
     */
    public mediaUpdate(
        id: number,
        requestBody: Media,
    ): CancelablePromise<Media> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/media/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update a media file
     * @param id
     * @param requestBody
     * @returns Media
     * @throws ApiError
     */
    public mediaPartialUpdate(
        id: number,
        requestBody?: PatchedMedia,
    ): CancelablePromise<Media> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/media/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a media file from both database and Cloudinary
     * @param id
     * @returns void
     * @throws ApiError
     */
    public mediaDestroy(
        id: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/media/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Bulk delete multiple media files
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public mediaBulkDeleteCreate(
        requestBody: BulkDelete,
    ): CancelablePromise<{
        deleted_count?: number;
        message?: string;
        cloudinary_warnings?: Array<string>;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/media/bulk-delete/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List all folders for the authenticated user
     * @param page A page number within the paginated result set.
     * @returns PaginatedFolderList
     * @throws ApiError
     */
    public mediaFoldersList(
        page?: number,
    ): CancelablePromise<PaginatedFolderList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/media/folders/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Create a new folder
     * @param requestBody
     * @returns Folder
     * @throws ApiError
     */
    public mediaFoldersCreate(
        requestBody: Folder,
    ): CancelablePromise<Folder> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/media/folders/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a folder
     * @param id
     * @returns Folder
     * @throws ApiError
     */
    public mediaFoldersRetrieve(
        id: number,
    ): CancelablePromise<Folder> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/media/folders/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a folder
     * @param id
     * @param requestBody
     * @returns Folder
     * @throws ApiError
     */
    public mediaFoldersUpdate(
        id: number,
        requestBody: Folder,
    ): CancelablePromise<Folder> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/media/folders/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update a folder
     * @param id
     * @param requestBody
     * @returns Folder
     * @throws ApiError
     */
    public mediaFoldersPartialUpdate(
        id: number,
        requestBody?: PatchedFolder,
    ): CancelablePromise<Folder> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/media/folders/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a folder (moves media to default folder)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public mediaFoldersDestroy(
        id: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/media/folders/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Move multiple media files to a different folder
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public mediaMoveCreate(
        requestBody?: Record<string, any>,
    ): CancelablePromise<{
        updated_count?: number;
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/media/move/',
            body: requestBody,
            mediaType: 'type',
        });
    }
    /**
     * Get media statistics for the authenticated user including folder breakdown and recent uploads
     * @returns any
     * @throws ApiError
     */
    public mediaStatsRetrieve(): CancelablePromise<{
        total_media?: number;
        total_folders?: number;
        folders?: Array<{
            folder_id?: number;
            folder_name?: string;
            media_count?: number;
            is_default?: boolean;
        }>;
        recent_media?: Array<Media>;
        total_size_bytes?: number;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/media/stats/',
        });
    }
}
