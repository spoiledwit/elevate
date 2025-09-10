/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FieldTypeEnum } from './FieldTypeEnum';
export type CollectInfoField = {
    readonly id: number;
    field_type: FieldTypeEnum;
    label: string;
    placeholder?: string;
    is_required?: boolean;
    order?: number;
    /**
     * JSON array of options for multiple choice/dropdown/checkbox fields
     */
    options?: any;
    readonly created_at: string;
    readonly modified_at: string;
};

