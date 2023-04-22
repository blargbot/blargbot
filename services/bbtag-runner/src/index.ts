import { subtags, tagVariableScopeProviders } from '@bbtag/blargbot';
import { VariableNameParser, VariableProvider } from '@bbtag/variables';
import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { BBTagExecutionMessageBroker } from '@blargbot/bbtag-runner-client';
import { BBTagSourceMessageBroker } from '@blargbot/bbtag-source-client';
import { BBTagVariableHttpClient } from '@blargbot/bbtag-variables-client';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordChannelCacheHttpClient } from '@blargbot/discord-channel-cache-client';
import { DiscordChannelSearchHttpClient } from '@blargbot/discord-channel-search-client';
import { DiscordChoiceQueryMessageBroker } from '@blargbot/discord-choice-query-client';
import type discordeno from '@blargbot/discordeno';
import { DomainWhitelistHttpClient } from '@blargbot/domain-whitelist-client';
import env from '@blargbot/env';
import { MessageDumpsHttpClient } from '@blargbot/message-dumps-client';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { Metrics, MetricsPushService } from '@blargbot/metrics-client';
import { ModLogMessageBroker } from '@blargbot/mod-log-client';
import { SchedulerHttpClient } from '@blargbot/scheduler-client';
import snowflake from '@blargbot/snowflakes';
import { UserSettingsHttpClient } from '@blargbot/user-settings-client';
import { UserWarningsHttpClient } from '@blargbot/user-warnings-client';
import { createHash } from 'crypto';
import fetch from 'node-fetch';

import { createBBTagEngine } from './createBBTagEngine.js';
import { ChannelService } from './services/ChannelService.js';
import { CooldownService } from './services/CooldownService.js';
import { DeferredExecutionService } from './services/DeferredExecutionService.js';
import { DumpService } from './services/DumpService.js';
import { FetchService } from './services/FetchService.js';
import { GuildService } from './services/GuildService.js';
import { LockService } from './services/LockService.js';
import { MessageDumpUrlFactory } from './services/MessageDumpUrlFactory.js';
import { MessageService } from './services/MessageService.js';
import { MetricsService } from './services/MetricsService.js';
import { ModLogService } from './services/ModLogService.js';
import { RoleService } from './services/RoleService.js';
import { SourceProvider } from './services/SourceProvider.js';
import { StaffService } from './services/StaffService.js';
import { TimezoneProvider } from './services/TimezoneProvider.js';
import { UserService } from './services/UserService.js';
import { VariablesStore } from './services/VariablesStore.js';
import { WarningService } from './services/WarningService.js';

export class BBTagRunnerApplication extends ServiceHost {
    public constructor(options: BBTagRunnerApplicationOptions) {
        const serviceName = 'bbtag-runner';
        const snowflakes = snowflake.createFactory(parseInt(fullContainerId, 16), parseInt(createHash('sha256').update(serviceName).digest().toString('hex'), 16));
        const hub = new MessageHub(options.messages);
        const executeBroker = new BBTagExecutionMessageBroker(hub, serviceName);
        const metrics = new Metrics({ serviceName, instanceId: fullContainerId });
        const scheduler = new BBTagExecutionMessageBroker(hub, serviceName);
        const engine = createBBTagEngine({
            subtags: Object.values(subtags),
            middleware: [
                new MetricsService(metrics).subtagMiddleware
            ],
            variables: new VariableProvider(
                new VariableNameParser(tagVariableScopeProviders),
                new VariablesStore(new BBTagVariableHttpClient(options.variables.url))
            ),
            defer: new DeferredExecutionService(
                new SchedulerHttpClient(options.scheduler.url),
                scheduler.executeQueueName
            ),
            dump: new DumpService(
                new MessageDumpsHttpClient(options.messageDumps.url),
                snowflakes,
                new MessageDumpUrlFactory(options.messageDumps.websiteUrl)
            ),
            modLog: new ModLogService(new ModLogMessageBroker(hub, serviceName)),
            timezones: new TimezoneProvider(new UserSettingsHttpClient(options.userSettings.url)),
            warnings: new WarningService(new UserWarningsHttpClient(options.userWarnings.url)),
            fetch: new FetchService(new DomainWhitelistHttpClient(options.domainWhitelist.url), { fetch }),
            lock: new LockService(),
            staff: new StaffService(),
            sources: new SourceProvider(new BBTagSourceMessageBroker(hub, serviceName)),
            channels: new ChannelService(
                new DiscordChannelSearchHttpClient(options.channelSearch.url),
                new DiscordChannelCacheHttpClient(options.channelCache.url),
                new DiscordChoiceQueryMessageBroker(hub, serviceName)
            ),
            cooldowns: new CooldownService(),
            guild: new GuildService(),
            messages: new MessageService(),
            roles: new RoleService(),
            users: new UserService()
        });

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService(metrics)
            )
        ]);

        executeBroker;
        engine;
    }
}

if (isEntrypoint()) {
    host(new BBTagRunnerApplication({
        defaultPrefix: env.get(String, 'COMMAND_PREFIX'),
        variables: {
            url: env.bbtagVariablesUrl
        },
        scheduler: {
            url: env.schedulerUrl
        },
        discord: {
            token: env.discordToken,
            rest: {
                secretKey: env.discordProxySecret,
                customUrl: env.discordProxyUrl
            }
        },
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
        messageDumps: {
            url: env.messageDumpsUrl,
            websiteUrl: env.messageDumpsWebsiteUrl
        },
        userSettings: {
            url: env.userSettingsUrl
        },
        userWarnings: {
            url: env.userWarningsUrl
        },
        channelCache: {
            url: env.discordChannelCacheUrl
        },
        channelSearch: {
            url: env.discordChannelSearchUrl
        },
        domainWhitelist: {
            url: env.domainWhitelistUrl
        }
    }));
}

export interface BBTagRunnerApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly discord: discordeno.CreateProxiedBotOptions;
    readonly variables: {
        readonly url: string;
    };
    readonly scheduler: {
        readonly url: string;
    };
    readonly messageDumps: {
        readonly url: string;
        readonly websiteUrl: string;
    };
    readonly userSettings: {
        readonly url: string;
    };
    readonly userWarnings: {
        readonly url: string;
    };
    readonly channelCache: {
        readonly url: string;
    };
    readonly channelSearch: {
        readonly url: string;
    };
    readonly domainWhitelist: {
        readonly url: string;
    };
    readonly defaultPrefix: string;
}
