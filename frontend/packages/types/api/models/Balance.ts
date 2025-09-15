/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for account balance information
 */
export type Balance = {
    /**
     * Available balance by currency
     */
    available: any;
    /**
     * Pending balance by currency
     */
    pending: any;
    /**
     * Connect reserved funds
     */
    connect_reserved?: any;
    /**
     * Whether this is live mode data
     */
    livemode: boolean;
};

