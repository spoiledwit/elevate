/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AutomationRuleCreate } from '../models/AutomationRuleCreate';
import type { PaginatedAutomationRuleList } from '../models/PaginatedAutomationRuleList';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DmAutomationRulesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List DM automation rules or create a new rule for authenticated user.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAutomationRuleList
     * @throws ApiError
     */
    public dmAutomationRulesList(
        page?: number,
    ): CancelablePromise<PaginatedAutomationRuleList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/dm-automation-rules/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * List DM automation rules or create a new rule for authenticated user.
     * @param requestBody
     * @returns AutomationRuleCreate
     * @throws ApiError
     */
    public dmAutomationRulesCreate(
        requestBody: AutomationRuleCreate,
    ): CancelablePromise<AutomationRuleCreate> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/dm-automation-rules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
