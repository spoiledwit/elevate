/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Milo call logs
 */
export type MiloCallLog = {
    readonly id: number;
    readonly user: number;
    readonly user_email: string;
    readonly username: string;
    /**
     * Eleven Labs conversation ID if available
     */
    conversation_id?: string;
    /**
     * Total duration of the call in seconds
     */
    call_duration_seconds?: number;
    readonly call_duration_minutes: string;
    /**
     * Credits deducted for this call (0.5 per minute)
     */
    credits_used?: string;
    readonly calculated_credits: string;
    started_at?: string | null;
    ended_at?: string | null;
    readonly created_at: string;
    metadata?: any;
};

