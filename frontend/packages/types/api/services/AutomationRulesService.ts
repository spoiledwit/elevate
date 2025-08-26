/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommentAutomationRule } from '../models/CommentAutomationRule';
import type { CommentAutomationRuleCreate } from '../models/CommentAutomationRuleCreate';
import type { PaginatedCommentAutomationRuleList } from '../models/PaginatedCommentAutomationRuleList';
import type { PatchedCommentAutomationRule } from '../models/PatchedCommentAutomationRule';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AutomationRulesService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List automation rules or create a new rule for authenticated user.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCommentAutomationRuleList
     * @throws ApiError
     */
    public automationRulesList(
        page?: number,
    ): CancelablePromise<PaginatedCommentAutomationRuleList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/automation-rules/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * List automation rules or create a new rule for authenticated user.
     * @param requestBody
     * @returns CommentAutomationRuleCreate
     * @throws ApiError
     */
    public automationRulesCreate(
        requestBody: CommentAutomationRuleCreate,
    ): CancelablePromise<CommentAutomationRuleCreate> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/automation-rules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get, update, or delete a specific automation rule.
     * @param id
     * @returns CommentAutomationRule
     * @throws ApiError
     */
    public automationRulesRetrieve(
        id: number,
    ): CancelablePromise<CommentAutomationRule> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/automation-rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get, update, or delete a specific automation rule.
     * @param id
     * @param requestBody
     * @returns CommentAutomationRule
     * @throws ApiError
     */
    public automationRulesUpdate(
        id: number,
        requestBody: CommentAutomationRule,
    ): CancelablePromise<CommentAutomationRule> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/automation-rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get, update, or delete a specific automation rule.
     * @param id
     * @param requestBody
     * @returns CommentAutomationRule
     * @throws ApiError
     */
    public automationRulesPartialUpdate(
        id: number,
        requestBody?: PatchedCommentAutomationRule,
    ): CancelablePromise<CommentAutomationRule> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/automation-rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get, update, or delete a specific automation rule.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public automationRulesDestroy(
        id: number,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/automation-rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Toggle automation rule active/inactive status.
     * @param ruleId
     * @returns any No response body
     * @throws ApiError
     */
    public automationRulesToggleCreate(
        ruleId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/automation-rules/{rule_id}/toggle/',
            path: {
                'rule_id': ruleId,
            },
        });
    }
}
