/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailAccount } from '../models/EmailAccount';
import type { EmailDraft } from '../models/EmailDraft';
import type { EmailMessage } from '../models/EmailMessage';
import type { EmailSend } from '../models/EmailSend';
import type { EmailSendResponse } from '../models/EmailSendResponse';
import type { EmailSync } from '../models/EmailSync';
import type { EmailSyncResponse } from '../models/EmailSyncResponse';
import type { GmailAccountResponse } from '../models/GmailAccountResponse';
import type { GmailAuthUrl } from '../models/GmailAuthUrl';
import type { PaginatedEmailMessageListList } from '../models/PaginatedEmailMessageListList';
import type { PatchedEmailDraft } from '../models/PatchedEmailDraft';
import type { PatchedEmailMarkRead } from '../models/PatchedEmailMarkRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class EmailService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * List Email Accounts
     * Get list of user's connected Gmail accounts
     * @returns EmailAccount
     * @throws ApiError
     */
    public emailAccountsList(): CancelablePromise<Array<EmailAccount>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/accounts/',
        });
    }
    /**
     * Disconnect Email Account
     * Disconnect a Gmail account
     * @param accountId
     * @returns any
     * @throws ApiError
     */
    public emailAccountsDisconnectDestroy(
        accountId: number,
    ): CancelablePromise<{
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/email/accounts/{account_id}/disconnect/',
            path: {
                'account_id': accountId,
            },
        });
    }
    /**
     * Get Gmail OAuth URL
     * Generate OAuth authorization URL for Gmail account connection
     * @returns GmailAuthUrl
     * @throws ApiError
     */
    public emailAuthGoogleRetrieve(): CancelablePromise<GmailAuthUrl> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/auth/google/',
        });
    }
    /**
     * Gmail OAuth Callback
     * Handle OAuth callback and connect Gmail account
     * @param code
     * @param state
     * @returns GmailAccountResponse
     * @throws ApiError
     */
    public emailCallbackGoogleRetrieve(
        code: string,
        state?: string,
    ): CancelablePromise<GmailAccountResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/callback/google/',
            query: {
                'code': code,
                'state': state,
            },
        });
    }
    /**
     * List Email Drafts
     * Get list of email drafts
     * @returns EmailDraft
     * @throws ApiError
     */
    public emailDraftsList(): CancelablePromise<Array<EmailDraft>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/drafts/',
        });
    }
    /**
     * Create Email Draft
     * Create a new email draft
     * @param requestBody
     * @returns EmailDraft
     * @throws ApiError
     */
    public emailDraftsCreate(
        requestBody: EmailDraft,
    ): CancelablePromise<EmailDraft> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/email/drafts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update Email Draft
     * Update an existing email draft
     * @param draftId
     * @param requestBody
     * @returns EmailDraft
     * @throws ApiError
     */
    public emailDraftsPartialUpdate(
        draftId: number,
        requestBody?: PatchedEmailDraft,
    ): CancelablePromise<EmailDraft> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/email/drafts/{draft_id}/',
            path: {
                'draft_id': draftId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete Email Draft
     * Delete an email draft
     * @param draftId
     * @returns any
     * @throws ApiError
     */
    public emailDraftsDestroy(
        draftId: number,
    ): CancelablePromise<{
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/email/drafts/{draft_id}/',
            path: {
                'draft_id': draftId,
            },
        });
    }
    /**
     * List Email Messages
     * Get list of email messages from connected accounts
     * @param page A page number within the paginated result set.
     * @param pageSize Number of results to return per page.
     * @returns PaginatedEmailMessageListList
     * @throws ApiError
     */
    public emailMessagesList(
        page?: number,
        pageSize?: number,
    ): CancelablePromise<PaginatedEmailMessageListList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/messages/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * Get Email Message Detail
     * Get detailed information about an email message
     * @param messageId
     * @returns EmailMessage
     * @throws ApiError
     */
    public emailMessagesRetrieve(
        messageId: number,
    ): CancelablePromise<EmailMessage> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/email/messages/{message_id}/',
            path: {
                'message_id': messageId,
            },
        });
    }
    /**
     * Delete Email
     * Move email to trash
     * @param messageId
     * @returns any
     * @throws ApiError
     */
    public emailMessagesDeleteDestroy(
        messageId: number,
    ): CancelablePromise<{
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/email/messages/{message_id}/delete/',
            path: {
                'message_id': messageId,
            },
        });
    }
    /**
     * Mark Email as Read/Unread
     * Update read status of an email
     * @param messageId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public emailMessagesReadPartialUpdate(
        messageId: number,
        requestBody?: PatchedEmailMarkRead,
    ): CancelablePromise<{
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/email/messages/{message_id}/read/',
            path: {
                'message_id': messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send Email
     * Send an email via Gmail
     * @param requestBody
     * @returns EmailSendResponse
     * @throws ApiError
     */
    public emailSendCreate(
        requestBody: EmailSend,
    ): CancelablePromise<EmailSendResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/email/send/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Sync Emails
     * Sync emails from Gmail account
     * @param requestBody
     * @returns EmailSyncResponse
     * @throws ApiError
     */
    public emailSyncCreate(
        requestBody: EmailSync,
    ): CancelablePromise<EmailSyncResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/email/sync/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
