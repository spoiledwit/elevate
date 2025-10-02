/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CTABanner } from './CTABanner';
import type { CustomLink } from './CustomLink';
import type { SocialIcon } from './SocialIcon';
export type PatchedUserProfile = {
    readonly id?: number;
    slug?: string;
    display_name?: string;
    bio?: string;
    readonly profile_image?: string;
    embedded_video?: string;
    /**
     * Affiliate/purchase link for funnel injection
     */
    affiliate_link?: string;
    is_active?: boolean;
    readonly social_icons?: Array<SocialIcon>;
    readonly custom_links?: Array<CustomLink>;
    readonly cta_banner?: CTABanner;
};

