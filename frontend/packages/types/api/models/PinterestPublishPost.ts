/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PinterestPublishPost = {
    connection_id: number;
    /**
     * Pinterest board ID
     */
    board_id: string;
    /**
     * Pin description
     */
    description: string;
    /**
     * Image URL for the pin
     */
    media_url: string;
    /**
     * Pin title
     */
    title?: string;
    /**
     * Destination URL when pin is clicked
     */
    link?: string;
    /**
     * Alt text for accessibility
     */
    alt_text?: string;
};

