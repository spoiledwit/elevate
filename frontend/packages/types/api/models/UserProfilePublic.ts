/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CTABanner } from './CTABanner';
import type { CustomLink } from './CustomLink';
import type { SocialIcon } from './SocialIcon';
export type UserProfilePublic = {
    slug?: string;
    display_name: string;
    bio?: string;
    readonly profile_image: string;
    embedded_video?: string;
    /**
     * Affiliate/purchase link for funnel injection
     */
    affiliate_link?: string;
    /**
     * Creator's referral or promotional code
     */
    creators_code?: string;
    /**
     * Nurture email content or template
     */
    nurture_email?: string;
    readonly social_icons: Array<SocialIcon>;
    readonly custom_links: Array<CustomLink>;
    readonly cta_banner: CTABanner;
};

