import { subtags, tagVariableScopeProviders } from '@bbtag/blargbot';
import { VariableNameParser, VariableProvider } from '@bbtag/variables';
import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { BBTagExecutionMessageBroker } from '@blargbot/bbtag-runner-client';
import { BBTagSourceMessageBroker } from '@blargbot/bbtag-source-client';
import { BBTagVariableHttpClient } from '@blargbot/bbtag-variables-client';
import { fullContainerId } from '@blargbot/container-id';
import { DomainWhitelistHttpClient } from '@blargbot/domain-whitelist-client';
import env from '@blargbot/env';
import { MessageDumpsHttpClient } from '@blargbot/message-dumps-client';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { Metrics, MetricsPushService } from '@blargbot/metrics-client';
import { ModLogMessageBroker } from '@blargbot/mod-log-client';
import snowflake from '@blargbot/snowflakes';
import { TimeoutHttpClient } from '@blargbot/timeouts-client';
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
        const timeouts = new BBTagExecutionMessageBroker(hub, serviceName);
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
                new TimeoutHttpClient(options.timeout.url),
                timeouts.executeQueueName
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
            channels: new ChannelService(),
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
        timeout: {
            url: env.timeoutUrl
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
        domainWhitelist: {
            url: env.domainWhitelistUrl
        }
    }));
}

export interface BBTagRunnerApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly variables: {
        readonly url: string;
    };
    readonly timeout: {
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
    readonly domainWhitelist: {
        readonly url: string;
    };
    readonly defaultPrefix: string;
}
