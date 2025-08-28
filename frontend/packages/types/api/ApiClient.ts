/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AiService } from './services/AiService';
import { AuthService } from './services/AuthService';
import { AutomationRulesService } from './services/AutomationRulesService';
import { AutomationSettingsService } from './services/AutomationSettingsService';
import { AutomationStatsService } from './services/AutomationStatsService';
import { CommentRepliesService } from './services/CommentRepliesService';
import { CommentsService } from './services/CommentsService';
import { DirectMessagesService } from './services/DirectMessagesService';
import { DmAutomationRulesService } from './services/DmAutomationRulesService';
import { DmAutomationStatsService } from './services/DmAutomationStatsService';
import { DmRepliesService } from './services/DmRepliesService';
import { IntegrationsService } from './services/IntegrationsService';
import { MediaService } from './services/MediaService';
import { PlansService } from './services/PlansService';
import { PostsService } from './services/PostsService';
import { ProfilesService } from './services/ProfilesService';
import { SchemaService } from './services/SchemaService';
import { StorefrontService } from './services/StorefrontService';
import { SubscriptionsService } from './services/SubscriptionsService';
import { TokenService } from './services/TokenService';
import { UsersService } from './services/UsersService';
import { WebhooksService } from './services/WebhooksService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class ApiClient {
    public readonly ai: AiService;
    public readonly auth: AuthService;
    public readonly automationRules: AutomationRulesService;
    public readonly automationSettings: AutomationSettingsService;
    public readonly automationStats: AutomationStatsService;
    public readonly commentReplies: CommentRepliesService;
    public readonly comments: CommentsService;
    public readonly directMessages: DirectMessagesService;
    public readonly dmAutomationRules: DmAutomationRulesService;
    public readonly dmAutomationStats: DmAutomationStatsService;
    public readonly dmReplies: DmRepliesService;
    public readonly integrations: IntegrationsService;
    public readonly media: MediaService;
    public readonly plans: PlansService;
    public readonly posts: PostsService;
    public readonly profiles: ProfilesService;
    public readonly schema: SchemaService;
    public readonly storefront: StorefrontService;
    public readonly subscriptions: SubscriptionsService;
    public readonly token: TokenService;
    public readonly users: UsersService;
    public readonly webhooks: WebhooksService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '0.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.ai = new AiService(this.request);
        this.auth = new AuthService(this.request);
        this.automationRules = new AutomationRulesService(this.request);
        this.automationSettings = new AutomationSettingsService(this.request);
        this.automationStats = new AutomationStatsService(this.request);
        this.commentReplies = new CommentRepliesService(this.request);
        this.comments = new CommentsService(this.request);
        this.directMessages = new DirectMessagesService(this.request);
        this.dmAutomationRules = new DmAutomationRulesService(this.request);
        this.dmAutomationStats = new DmAutomationStatsService(this.request);
        this.dmReplies = new DmRepliesService(this.request);
        this.integrations = new IntegrationsService(this.request);
        this.media = new MediaService(this.request);
        this.plans = new PlansService(this.request);
        this.posts = new PostsService(this.request);
        this.profiles = new ProfilesService(this.request);
        this.schema = new SchemaService(this.request);
        this.storefront = new StorefrontService(this.request);
        this.subscriptions = new SubscriptionsService(this.request);
        this.token = new TokenService(this.request);
        this.users = new UsersService(this.request);
        this.webhooks = new WebhooksService(this.request);
    }
}

