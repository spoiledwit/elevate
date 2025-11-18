/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CTABanner } from './CTABanner';
import type { CustomLink } from './CustomLink';
import type { SocialIcon } from './SocialIcon';
export type UserProfile = {
    readonly id: number;
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
    /**
     * Contact email displayed on storefront
     */
    contact_email?: string;
    is_active?: boolean;
    /**
     * Default setting for email automation on new leads. When enabled, all new leads will automatically receive follow-up emails unless individually disabled.
     */
    email_automation_enabled?: boolean;
    /**
     * Available credits for Milo AI calls. 0.5 credits = 1 minute
     */
    milo_credits?: string;
    /**
     * Lifetime total credits purchased
     */
    readonly total_credits_purchased: string;
    /**
     * Lifetime total credits used
     */
    readonly total_credits_used: string;
    readonly social_icons: Array<SocialIcon>;
    readonly custom_links: Array<CustomLink>;
    readonly cta_banner: CTABanner;
};

