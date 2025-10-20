/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomTokenObtainPair } from '../models/CustomTokenObtainPair';
import type { PatchedUserCurrent } from '../models/PatchedUserCurrent';
import type { TokenRefresh } from '../models/TokenRefresh';
import type { UserChangePassword } from '../models/UserChangePassword';
import type { UserCreate } from '../models/UserCreate';
import type { UserCurrent } from '../models/UserCurrent';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public authChangePasswordCreate(
        requestBody: UserChangePassword,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/change-password/',
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
    public authCheckUsernameCreate(
        requestBody?: UserCurrent,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/check-username/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `No response body`,
            },
        });
    }
    /**
     * Verify Google OAuth token and return JWT tokens
     * @returns any No response body
     * @throws ApiError
     */
    public authGoogleCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/google/',
        });
    }
    /**
     * Register a new user with Google OAuth (same as login for Google OAuth)
     * @returns any No response body
     * @throws ApiError
     */
    public authGoogleRegisterCreate(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/google/register/',
        });
    }
    /**
     * Takes a set of user credentials and returns an access and refresh JSON web
     * token pair to prove the authentication of those credentials.
     * @param requestBody
     * @returns CustomTokenObtainPair
     * @throws ApiError
     */
    public authLoginCreate(
        requestBody: CustomTokenObtainPair,
    ): CancelablePromise<CustomTokenObtainPair> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns UserCurrent
     * @throws ApiError
     */
    public authMeRetrieve(): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/me/',
        });
    }
    /**
     * @param requestBody
     * @returns UserCurrent
     * @throws ApiError
     */
    public authMeUpdate(
        requestBody?: UserCurrent,
    ): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/auth/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns UserCurrent
     * @throws ApiError
     */
    public authMePartialUpdate(
        requestBody?: PatchedUserCurrent,
    ): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/auth/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns UserCreate
     * @throws ApiError
     */
    public authRegisterCreate(
        requestBody: UserCreate,
    ): CancelablePromise<UserCreate> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Takes a refresh type JSON web token and returns an access type JSON web
     * token if the refresh token is valid.
     * @param requestBody
     * @returns TokenRefresh
     * @throws ApiError
     */
    public authTokenRefreshCreate(
        requestBody: TokenRefresh,
    ): CancelablePromise<TokenRefresh> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/token/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify if the authenticated user exists in the database.
     * Used by middleware to check OAuth users who might not have completed registration.
     * @returns UserCurrent
     * @throws ApiError
     */
    public authVerifyUserRetrieve(): CancelablePromise<UserCurrent> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/auth/verify-user/',
        });
    }
}
