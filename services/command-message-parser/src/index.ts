import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { CommandMessageParserMessageBroker } from '@blargbot/command-message-parser-client';
import { fullContainerId } from '@blargbot/container-id';
import { CurrentUserAccessor } from '@blargbot/current-user-accessor';
import { DiscordMessageStreamMessageBroker } from '@blargbot/discord-message-stream-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { CommandMessageParserService } from './CommandMessageParserService.js';

@hostIfEntrypoint(() => [{
    defaultPrefix: env.get(String, 'COMMAND_PREFIX'),
    discordUserCache: {
        url: env.discordUserCacheUrl
    },
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    guildSettings: {
        url: env.guildSettingsUrl
    },
    userSettings: {
        url: env.userSettingsUrl
    }
}])
export class CommandMessageParserApplication extends ServiceHost {
    public constructor(options: DiscordChatlogApplicationOptions) {
        const serviceName = 'command-message-parser';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });

        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
            new CommandMessageParserService(
                new DiscordMessageStreamMessageBroker(messages, serviceName),
                new CommandMessageParserMessageBroker(messages, serviceName),
                new CurrentUserAccessor({
                    userCacheUrl: options.discordUserCache.url,
                    refreshInterval: options.discordUserCache.refreshInterval,
                    retryInterval: options.discordUserCache.retryInterval
                }),
                {
                    guildSettingsUrl: options.guildSettings.url,
                    userSettingsUrl: options.userSettings.url,
                    defaultPrefix: options.defaultPrefix
                }
            )
        ]);
    }
}

export interface DiscordChatlogApplicationOptions {
    readonly defaultPrefix: string;
    readonly messages: ConnectionOptions;
    readonly guildSettings: {
        readonly url: string;
    };
    readonly userSettings: {
        readonly url: string;
    };
    readonly discordUserCache: {
        readonly url: string;
        readonly refreshInterval?: number;
        readonly retryInterval?: number;
    };
}
