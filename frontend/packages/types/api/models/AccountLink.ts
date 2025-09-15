/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TypeEnum } from './TypeEnum';
/**
 * Serializer for creating account links
 */
export type AccountLink = {
    /**
     * URL to redirect to if user needs to restart onboarding
     */
    refresh_url: string;
    /**
     * URL to redirect to after onboarding completion
     */
    return_url: string;
    /**
     * Type of account link to create
     *
     * * `account_onboarding` - account_onboarding
     * * `account_update` - account_update
     */
    type?: TypeEnum;
};

