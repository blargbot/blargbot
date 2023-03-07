import type { ICurrentUserAccessor } from '@blargbot/current-user-accessor';
import type { ExtendedMessage } from '@blargbot/discord-message-stream-contract';
import { markup } from '@blargbot/discord-util';
import { hasValue } from '@blargbot/guards';
import type { GuildSettings } from '@blargbot/guild-settings-contract';
import guildSettings from '@blargbot/guild-settings-contract';
import { splitInput } from '@blargbot/input';
import type { MessageHandle } from '@blargbot/message-hub';
import type { UserSettings } from '@blargbot/user-settings-contract';
import userSettings from '@blargbot/user-settings-contract';
import fetch from 'node-fetch';

import type { CommandMessageParserMessageBroker } from './CommandMessageParserMessageBroker.js';

export class CommandMessageParserService {
    readonly #messages: CommandMessageParserMessageBroker;
    readonly #handles: Set<MessageHandle>;
    readonly #guildSettings: string;
    readonly #userSettings: string;
    readonly #defaultPrefix: string;
    readonly #user: ICurrentUserAccessor;

    public constructor(
        messages: CommandMessageParserMessageBroker,
        user: ICurrentUserAccessor,
        options: CommandMessageParserServiceOptions
    ) {
        this.#messages = messages;
        this.#user = user;
        this.#guildSettings = options.guildSettingsUrl;
        this.#userSettings = options.userSettingsUrl;
        this.#defaultPrefix = options.defaultPrefix;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #loadUserSettings(userId: string): Promise<UserSettings> {
        const settingsResponse = await fetch(new URL(userId, this.#userSettings).toString());
        const body = await settingsResponse.json();
        return userSettings.read(JSON.stringify(body));
    }

    async #loadGuildSettings(guildId?: string): Promise<GuildSettings | undefined> {
        if (guildId === undefined)
            return undefined;

        const settingsResponse = await fetch(new URL(guildId, this.#guildSettings).toString());
        const body = await settingsResponse.json();
        return guildSettings.read(JSON.stringify(body));
    }

    async #handleMessageCreate(trigger: ExtendedMessage): Promise<void> {
        if (trigger.author.bot === true || !hasValue(trigger.content) || trigger.content.length === 0)
            return;

        const prefixes = await this.#getPrefixes(trigger.author.id, trigger.guild_id);
        const prefix = prefixes.sort((a, b) => b.length - a.length).find(p => trigger.content.startsWith(p));
        if (prefix === undefined)
            return;

        const commandRaw = trigger.content.slice(prefix.length);
        const [commandNamePart, ...args] = splitInput(commandRaw);

        await this.#messages.sendCommand(Object.assign(trigger, {
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
            this.#loadUserSettings(userId),
            this.#user.getOrWait(),
            this.#loadGuildSettings(guildId)
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
    readonly guildSettingsUrl: string;
    readonly userSettingsUrl: string;
}
