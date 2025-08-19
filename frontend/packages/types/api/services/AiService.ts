/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AiService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Analyze images using OpenAI Vision
     * Analyze images and answer questions about them using OpenAI's vision models
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public analyzeImage(
        formData?: {
            /**
             * Image file to analyze
             */
            image: Blob;
            /**
             * Question about the image
             */
            prompt?: string;
            /**
             * Vision model to use
             */
            model?: string;
            /**
             * Maximum tokens to generate
             */
            max_tokens?: number;
            /**
             * Level of detail (low, high, auto)
             */
            detail?: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        analysis?: string;
        model?: string;
        usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/analyze-image/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Generate images using OpenAI DALL-E
     * Generate images from text prompts using OpenAI's DALL-E models
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public generateImage(
        requestBody?: {
            /**
             * Description of the image to generate
             */
            prompt: string;
            /**
             * Model to use (dall-e-2, dall-e-3)
             */
            model?: string;
            /**
             * Image size
             */
            size?: string;
            /**
             * Image quality (standard, hd)
             */
            quality?: string;
            /**
             * Number of images to generate
             */
            'n'?: number;
            /**
             * Image style (vivid, natural)
             */
            style?: string;
            /**
             * Save images to media directory
             */
            save_to_media?: boolean;
        },
    ): CancelablePromise<{
        success?: boolean;
        images?: Array<{
            b64_json?: string;
            revised_prompt?: string;
            /**
             * URL if saved to media
             */
            url?: string;
        }>;
        model?: string;
        prompt?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/generate-image/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate social media content
     * Generate platform-specific social media content using AI
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public generateSocialContent(
        requestBody?: {
            /**
             * Social media platform
             */
            platform: string;
            /**
             * Content topic or theme
             */
            topic: string;
            /**
             * Writing tone
             */
            tone?: string;
            /**
             * Maximum character length
             */
            max_length?: number;
            /**
             * Include hashtags
             */
            include_hashtags?: boolean;
        },
    ): CancelablePromise<{
        success?: boolean;
        text?: string;
        model?: string;
        usage?: Record<string, any>;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/generate-social-content/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate text using OpenAI
     * Generate text content using OpenAI's language models
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public generateText(
        requestBody?: {
            /**
             * The text prompt
             */
            prompt: string;
            /**
             * Model to use (optional)
             */
            model?: string;
            /**
             * Maximum tokens to generate
             */
            max_tokens?: number;
            /**
             * Creativity level (0-2)
             */
            temperature?: number;
            /**
             * System instructions (optional)
             */
            system_message?: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        text?: string;
        model?: string;
        usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/generate-text/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate streaming text using OpenAI
     * Generate text content with streaming response using OpenAI's language models
     * @param requestBody
     * @returns string
     * @throws ApiError
     */
    public generateStreamingText(
        requestBody?: {
            /**
             * The text prompt
             */
            prompt: string;
            /**
             * Model to use (optional)
             */
            model?: string;
            /**
             * Maximum tokens to generate
             */
            max_tokens?: number;
            /**
             * Creativity level (0-2)
             */
            temperature?: number;
            /**
             * System instructions (optional)
             */
            system_message?: string;
        },
    ): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/generate-text-stream/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Improve existing content
     * Improve existing content using AI for grammar, clarity, engagement, etc.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public improveContent(
        requestBody?: {
            /**
             * Original content to improve
             */
            content: string;
            /**
             * Type of improvement
             */
            improvement_type?: string;
            /**
             * Target audience for the content
             */
            target_audience?: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        text?: string;
        model?: string;
        usage?: Record<string, any>;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/ai/improve-content/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
