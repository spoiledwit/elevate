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
    profile_image?: string | null;
    embedded_video?: string;
    readonly social_icons: Array<SocialIcon>;
    readonly custom_links: Array<CustomLink>;
    readonly cta_banner: CTABanner;
};

