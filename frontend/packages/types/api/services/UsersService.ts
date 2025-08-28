/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PasswordResetConfirm } from '../models/PasswordResetConfirm';
import type { PasswordResetRequest } from '../models/PasswordResetRequest';
import type { PatchedUserCurrent } from '../models/PatchedUserCurrent';
import type { UserChangePassword } from '../models/UserChangePassword';
import type { UserCreate } from '../models/UserCreate';
import type { UserCurrent } from '../models/UserCurrent';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UsersService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns UserCreate
     * @throws ApiError
     */
    public usersCreate(
        requestBody: UserCreate,
    ): CancelablePromise<UserCreate> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/users/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public usersChangePasswordCreate(
        requestBody: UserChangePassword,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/users/change-password/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Public endpoint to check if a username is available.
     * Returns {"available": true/false, "username": "requested_username"}
     * @param requestBody
     * @returns any No response body
     * @throws ApiError
     */
    public usersCheckUsernameCreate(
        requestBody: UserCurrent,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/users/check-username/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `No response body`,
            },
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public usersDeleteAccountDestroy(): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/users/delete-account/',
        });
    }
    /**
     * @returns UserCurrent
     * @throws ApiError
     */
    public usersMeRetrieve(): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/users/me/',
        });
    }
    /**
     * @param requestBody
     * @returns UserCurrent
     * @throws ApiError
     */
    public usersMeUpdate(
        requestBody: UserCurrent,
    ): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns UserCurrent
     * @throws ApiError
     */
    public usersMePartialUpdate(
        requestBody?: PatchedUserCurrent,
    ): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Confirm password reset using uid and token and set new password.
     * @param requestBody
     * @returns any No response body
     * @throws ApiError
     */
    public usersPasswordResetConfirmCreate(
        requestBody: PasswordResetConfirm,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/users/password-reset/confirm/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `No response body`,
            },
        });
    }
    /**
     * Send password reset email if the username exists. Always returns 200.
     * @param requestBody
     * @returns any No response body
     * @throws ApiError
     */
    public usersPasswordResetRequestCreate(
        requestBody: PasswordResetRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/users/password-reset/request/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
