import Application from '@blargbot/application';
import { CurrentUserAccessor } from '@blargbot/current-user-accessor';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { DCommandMessageParserMessageBroker } from './CommandMessageParserMessageBroker.js';
import { CommandMessageParserService } from './CommandMessageParserService.js';

@Application.hostIfEntrypoint(() => [{
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
export class CommandMessageParserApplication extends Application {
    readonly #messages: DCommandMessageParserMessageBroker;
    readonly #service: CommandMessageParserService;

    public constructor(options: DiscordChatlogApplicationOptions) {
        super();

        this.#messages = new DCommandMessageParserMessageBroker(options.messages);
        this.#service = new CommandMessageParserService(
            this.#messages,
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
        );
    }

    protected override async start(): Promise<void> {
        await this.#messages.connect();
        await this.#service.start();
    }

    protected override async stop(): Promise<void> {
        await this.#service.stop();
        await this.#messages.disconnect();
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
