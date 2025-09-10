/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UploadService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Upload any file type to Cloudinary and get the secure URL
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public uploadCreate(
        formData?: any,
    ): CancelablePromise<{
        /**
         * HTTPS URL of the uploaded file
         */
        secure_url?: string;
        /**
         * Cloudinary public ID
         */
        public_id?: string;
        /**
         * Type of uploaded resource
         */
        resource_type?: string;
        /**
         * File format
         */
        format?: string;
        /**
         * File size in bytes
         */
        size?: number;
        /**
         * Width (for images/videos)
         */
        width?: number;
        /**
         * Height (for images/videos)
         */
        height?: number;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/upload/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Delete a file from Cloudinary using its public ID
     * @returns any
     * @throws ApiError
     */
    public uploadDeleteDestroy(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/upload/delete/',
        });
    }
}
