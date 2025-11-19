/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type IframeMenuItem = {
    readonly id: number;
    /**
     * Menu item title
     */
    title: string;
    /**
     * URL-friendly identifier
     */
    slug: string;
    /**
     * URL to display in iframe
     */
    link: string;
    /**
     * Lucide React icon name
     */
    icon?: string;
    /**
     * Display order (lower numbers appear first)
     */
    order?: number;
    is_active?: boolean;
};

