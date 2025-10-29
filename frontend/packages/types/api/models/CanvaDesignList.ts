/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Status780Enum } from './Status780Enum';
/**
 * Simplified serializer for listing Canva designs
 */
export type CanvaDesignList = {
    readonly id: number;
    /**
     * Canva design ID
     */
    design_id: string;
    /**
     * Type of design (e.g., doc, Presentation)
     */
    design_type?: string;
    title?: string;
    /**
     * Design thumbnail
     */
    thumbnail_url?: string;
    /**
     * URL to edit design in Canva
     */
    edit_url?: string;
    status?: Status780Enum;
    readonly status_display: string;
    /**
     * Number of times design was opened
     */
    opened_count?: number;
    readonly created_at: string;
};

