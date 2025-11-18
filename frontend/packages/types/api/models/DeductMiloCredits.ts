/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for deducting Milo credits during voice calls
 */
export type DeductMiloCredits = {
    /**
     * Unique conversation/session ID from ElevenLabs
     */
    conversation_id: string;
    /**
     * Total minutes elapsed in the call
     */
    minutes_elapsed: number;
};

