import type { CommandMessageParserMessageBroker } from '@blargbot/command-message-parser-client';
import type { ICurrentUserAccessor } from '@blargbot/current-user-accessor';
import type { DiscordMessageStreamMessageBroker, ExtendedMessage } from '@blargbot/discord-message-stream-client';
import { markup } from '@blargbot/discord-util';
import { hasValue } from '@blargbot/guards';
import { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';
import { splitInput } from '@blargbot/input';
import type { MessageHandle } from '@blargbot/message-hub';
import { UserSettingsHttpClient } from '@blargbot/user-settings-client';

export class CommandMessageParserService {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #commands: CommandMessageParserMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #guildSettings: GuildSettingsHttpClient;
    readonly #userSettings: UserSettingsHttpClient;
    readonly #defaultPrefix: string;
    readonly #user: ICurrentUserAccessor;

    public constructor(
        messages: DiscordMessageStreamMessageBroker,
        commands: CommandMessageParserMessageBroker,
        user: ICurrentUserAccessor,
        options: CommandMessageParserServiceOptions
    ) {
        this.#messages = messages;
        this.#commands = commands;
        this.#user = user;
        this.#guildSettings = GuildSettingsHttpClient.from(options.guildSettingsClient ?? options.guildSettingsUrl);
        this.#userSettings = UserSettingsHttpClient.from(options.userSettingsClient ?? options.userSettingsUrl);
        this.#defaultPrefix = options.defaultPrefix;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMessage(this.#handleMessage.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #handleMessage(trigger: ExtendedMessage): Promise<void> {
        if (trigger.author.bot === true || !hasValue(trigger.content) || trigger.content.length === 0)
            return;

        const prefixes = await this.#getPrefixes(trigger.author.id, trigger.guild_id);
        const prefix = prefixes.sort((a, b) => b.length - a.length).find(p => trigger.content.startsWith(p));
        if (prefix === undefined)
            return;

        const commandRaw = trigger.content.slice(prefix.length);
        const [commandNamePart, ...args] = splitInput(commandRaw);

        await this.#commands.sendCommand(Object.assign(trigger, {
            prefix,
            command: commandNamePart.value.toLowerCase(),
            args: args.map(a => ({
                value: a.value,
                start: a.start + prefix.length,
                end: a.end + prefix.length
            }))
        }));
    }

    async #getPrefixes(userId: string, guildId?: string): Promise<string[]> {
        const [userSettings, botUser, guildSettings] = await Promise.all([
            this.#userSettings.getSettings({ userId }),
            this.#user.getOrWait(),
            guildId === undefined ? undefined : this.#guildSettings.getSettings({ guildId })
        ]);
        return [
            this.#defaultPrefix,
            ...userSettings.prefixes,
            ...guildSettings?.prefixes ?? [],
            markup.user(botUser.id),
            markup.user.nickname(botUser.id)
        ];
    }
}

interface CommandMessageParserServiceOptions {
    readonly defaultPrefix: string;
    readonly guildSettingsUrl?: string;
    readonly guildSettingsClient?: GuildSettingsHttpClient;
    readonly userSettingsUrl?: string;
    readonly userSettingsClient?: UserSettingsHttpClient;
}
