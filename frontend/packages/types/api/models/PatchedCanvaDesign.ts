/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Status780Enum } from './Status780Enum';
/**
 * Serializer for CanvaDesign model
 */
export type PatchedCanvaDesign = {
    readonly id?: number;
    readonly user?: number;
    readonly user_username?: string;
    readonly connection?: number;
    /**
     * Canva design ID
     */
    readonly design_id?: string;
    /**
     * Type of design (e.g., doc, Presentation)
     */
    design_type?: string;
    title?: string;
    /**
     * URL to edit design in Canva
     */
    edit_url?: string;
    /**
     * Design thumbnail
     */
    thumbnail_url?: string;
    /**
     * URL to download exported design
     */
    export_url?: string | null;
    /**
     * Export format (png, jpg, pdf)
     */
    export_format?: string;
    readonly exported_at?: string | null;
    status?: Status780Enum;
    readonly status_display?: string;
    /**
     * Additional design metadata
     */
    metadata?: any;
    /**
     * Number of times design was opened
     */
    readonly opened_count?: number;
    readonly last_opened_at?: string | null;
    readonly created_at?: string;
    readonly modified_at?: string;
};

