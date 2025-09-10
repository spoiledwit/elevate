/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FieldTypeEnum } from './FieldTypeEnum';
/**
 * Serializer for creating/updating collect info fields
 */
export type CollectInfoFieldCreateUpdate = {
    field_type: FieldTypeEnum;
    label: string;
    placeholder?: string;
    is_required?: boolean;
    order?: number;
    /**
     * JSON array of options for multiple choice/dropdown/checkbox fields
     */
    options?: any;
};

