/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CTABanner } from '../models/CTABanner';
import type { CustomLink } from '../models/CustomLink';
import type { CustomLinkCreateUpdate } from '../models/CustomLinkCreateUpdate';
import type { PaginatedCTABannerList } from '../models/PaginatedCTABannerList';
import type { PaginatedCustomLinkList } from '../models/PaginatedCustomLinkList';
import type { PaginatedSocialIconList } from '../models/PaginatedSocialIconList';
import type { PaginatedUserProfileList } from '../models/PaginatedUserProfileList';
import type { PatchedCTABanner } from '../models/PatchedCTABanner';
import type { PatchedCustomLinkCreateUpdate } from '../models/PatchedCustomLinkCreateUpdate';
import type { PatchedSocialIcon } from '../models/PatchedSocialIcon';
import type { PatchedUserProfile } from '../models/PatchedUserProfile';
import type { ProfileAnalytics } from '../models/ProfileAnalytics';
import type { SocialIcon } from '../models/SocialIcon';
import type { UserProfile } from '../models/UserProfile';
import type { UserProfilePublic } from '../models/UserProfilePublic';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class StorefrontService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCTABannerList
     * @throws ApiError
     */
    public storefrontCtaBannersList(
        page?: number,
    ): CancelablePromise<PaginatedCTABannerList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/cta-banners/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param requestBody
     * @returns CTABanner
     * @throws ApiError
     */
    public storefrontCtaBannersCreate(
        requestBody: CTABanner,
    ): CancelablePromise<CTABanner> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/cta-banners/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param id
     * @returns CTABanner
     * @throws ApiError
     */
    public storefrontCtaBannersRetrieve(
        id: string,
    ): CancelablePromise<CTABanner> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/cta-banners/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param id
     * @param requestBody
     * @returns CTABanner
     * @throws ApiError
     */
    public storefrontCtaBannersUpdate(
        id: string,
        requestBody: CTABanner,
    ): CancelablePromise<CTABanner> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/storefront/cta-banners/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param id
     * @param requestBody
     * @returns CTABanner
     * @throws ApiError
     */
    public storefrontCtaBannersPartialUpdate(
        id: string,
        requestBody?: PatchedCTABanner,
    ): CancelablePromise<CTABanner> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/storefront/cta-banners/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing CTA banner in storefront.
     * Each user can have only one CTA banner.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public storefrontCtaBannersDestroy(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/storefront/cta-banners/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Track CTA banner click
     * Track a click on a CTA banner for analytics with rate limiting and privacy protection.
     * @param bannerId
     * @param id A unique integer value identifying this CTA banner.
     * @param requestBody
     * @returns CTABanner
     * @throws ApiError
     */
    public storefrontCtaBannersTrackClickCreate(
        bannerId: number,
        id: number,
        requestBody: CTABanner,
    ): CancelablePromise<CTABanner> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/cta-banners/{id}/track-click/',
            path: {
                'banner_id': bannerId,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCustomLinkList
     * @throws ApiError
     */
    public storefrontLinksList(
        page?: number,
    ): CancelablePromise<PaginatedCustomLinkList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/links/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param formData
     * @returns CustomLinkCreateUpdate
     * @throws ApiError
     */
    public storefrontLinksCreate(
        formData: CustomLinkCreateUpdate,
    ): CancelablePromise<CustomLinkCreateUpdate> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/links/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param id
     * @returns CustomLink
     * @throws ApiError
     */
    public storefrontLinksRetrieve(
        id: string,
    ): CancelablePromise<CustomLink> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/links/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param id
     * @param formData
     * @returns CustomLinkCreateUpdate
     * @throws ApiError
     */
    public storefrontLinksUpdate(
        id: string,
        formData: CustomLinkCreateUpdate,
    ): CancelablePromise<CustomLinkCreateUpdate> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/storefront/links/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param id
     * @param formData
     * @returns CustomLinkCreateUpdate
     * @throws ApiError
     */
    public storefrontLinksPartialUpdate(
        id: string,
        formData?: PatchedCustomLinkCreateUpdate,
    ): CancelablePromise<CustomLinkCreateUpdate> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/storefront/links/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ViewSet for managing custom links in storefront.
     * Users can have up to 10 active custom links.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public storefrontLinksDestroy(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/storefront/links/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get link analytics
     * Get analytics data for a specific custom link including clicks, referrers, etc.
     * @param id
     * @returns any
     * @throws ApiError
     */
    public storefrontLinksAnalyticsRetrieve(
        id: string,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/links/{id}/analytics/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Track link click
     * Track a click on a custom link for analytics with rate limiting and privacy protection.
     * @param id A unique integer value identifying this custom link.
     * @param linkId
     * @param formData
     * @returns CustomLink
     * @throws ApiError
     */
    public storefrontLinksTrackClickCreate(
        id: number,
        linkId: number,
        formData: CustomLink,
    ): CancelablePromise<CustomLink> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/links/{id}/track-click/',
            path: {
                'id': id,
                'link_id': linkId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Reorder custom links
     * Reorder custom links by updating their order field.
     * Expects: [{"id": 1, "order": 1}, {"id": 2, "order": 2}, ...]
     * @param page A page number within the paginated result set.
     * @param requestBody
     * @returns PaginatedCustomLinkList
     * @throws ApiError
     */
    public storefrontLinksReorderCreate(
        page?: number,
        requestBody?: Record<string, any>,
    ): CancelablePromise<PaginatedCustomLinkList> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/links/reorder/',
            query: {
                'page': page,
            },
            body: requestBody,
            mediaType: 'type',
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserProfileList
     * @throws ApiError
     */
    public storefrontProfilesList(
        page?: number,
    ): CancelablePromise<PaginatedUserProfileList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/profiles/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesCreate(
        requestBody: UserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/profiles/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param id
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesRetrieve(
        id: string,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/profiles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param id
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesUpdate(
        id: string,
        requestBody: UserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/storefront/profiles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param id
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesPartialUpdate(
        id: string,
        requestBody?: PatchedUserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/storefront/profiles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing user profile storefront data.
     * Handles profile updates, image uploads, and public profile access.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public storefrontProfilesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/storefront/profiles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get profile analytics
     * Get profile analytics (views, clicks, etc.) with date range support.
     * Query params: days (default: 30), start_date, end_date
     * @returns ProfileAnalytics
     * @throws ApiError
     */
    public storefrontProfilesAnalyticsRetrieve(): CancelablePromise<ProfileAnalytics> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/profiles/analytics/',
        });
    }
    /**
     * Get comprehensive dashboard statistics
     * Get comprehensive dashboard statistics for the authenticated user.
     * Returns all analytics data in a single API call.
     * @returns any
     * @throws ApiError
     */
    public storefrontProfilesDashboardStatsRetrieve(): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/profiles/dashboard-stats/',
        });
    }
    /**
     * Get public profile by username
     * Get public profile by username for /username routing.
     * Returns profile with all storefront components.
     * @param username Username to fetch profile for
     * @returns UserProfilePublic
     * @throws ApiError
     */
    public storefrontProfilesPublicRetrieve(
        username: string,
    ): CancelablePromise<UserProfilePublic> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/profiles/public/{username}/',
            path: {
                'username': username,
            },
            errors: {
                404: `No response body`,
            },
        });
    }
    /**
     * Track profile view
     * Track a profile view for analytics with rate limiting and privacy protection.
     * @param username Username to track view for
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesTrackViewCreate(
        username: string,
        requestBody: UserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/profiles/track-view/{username}/',
            path: {
                'username': username,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update profile information
     * Update profile information (display_name, bio, embedded_video).
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesUpdateUpdate(
        requestBody: UserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/storefront/profiles/update/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update profile information
     * Update profile information (display_name, bio, embedded_video).
     * @param requestBody
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesUpdatePartialUpdate(
        requestBody?: PatchedUserProfile,
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/storefront/profiles/update/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload profile image
     * Upload profile image.
     * @param formData
     * @returns UserProfile
     * @throws ApiError
     */
    public storefrontProfilesUploadImageCreate(
        formData?: {
            image?: Blob;
        },
    ): CancelablePromise<UserProfile> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/profiles/upload-image/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param page A page number within the paginated result set.
     * @returns PaginatedSocialIconList
     * @throws ApiError
     */
    public storefrontSocialIconsList(
        page?: number,
    ): CancelablePromise<PaginatedSocialIconList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/social-icons/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param requestBody
     * @returns SocialIcon
     * @throws ApiError
     */
    public storefrontSocialIconsCreate(
        requestBody: SocialIcon,
    ): CancelablePromise<SocialIcon> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/storefront/social-icons/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param id
     * @returns SocialIcon
     * @throws ApiError
     */
    public storefrontSocialIconsRetrieve(
        id: string,
    ): CancelablePromise<SocialIcon> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/storefront/social-icons/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param id
     * @param requestBody
     * @returns SocialIcon
     * @throws ApiError
     */
    public storefrontSocialIconsUpdate(
        id: string,
        requestBody: SocialIcon,
    ): CancelablePromise<SocialIcon> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/storefront/social-icons/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param id
     * @param requestBody
     * @returns SocialIcon
     * @throws ApiError
     */
    public storefrontSocialIconsPartialUpdate(
        id: string,
        requestBody?: PatchedSocialIcon,
    ): CancelablePromise<SocialIcon> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/storefront/social-icons/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing social media icons in storefront.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public storefrontSocialIconsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/storefront/social-icons/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
