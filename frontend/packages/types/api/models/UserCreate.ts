/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserCreate = {
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username: string;
    email: string;
    password: string;
    password_retype: string;
    /**
     * Instagram profile URL
     */
    instagram?: string;
    /**
     * Facebook profile URL
     */
    facebook?: string;
    /**
     * Pinterest profile URL
     */
    pinterest?: string;
    /**
     * LinkedIn profile URL
     */
    linkedin?: string;
    /**
     * TikTok profile URL
     */
    tiktok?: string;
    /**
     * YouTube channel URL
     */
    youtube?: string;
    /**
     * Twitter/X profile URL
     */
    twitter?: string;
    /**
     * Personal website URL
     */
    website?: string;
};

