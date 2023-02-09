import { ChatLogType } from '@blargbot/chatlog-types';
import { guildSerializer } from '@blargbot/guild-settings';
import type { MessageHandle } from '@blargbot/message-broker';
import type * as discordeno from 'discordeno';
import fetch from 'node-fetch';

import type DiscordChatlogDatabase from './DiscordChatlogDatabase.js';
import type { DiscordChatlogMessageBroker } from './DiscordChatlogMessageBroker.js';

export class DiscordChatlogService {
    readonly #messages: DiscordChatlogMessageBroker;
    readonly #database: DiscordChatlogDatabase;
    readonly #handles: Set<MessageHandle>;
    readonly #guildSettings: string;

    public constructor(messages: DiscordChatlogMessageBroker, database: DiscordChatlogDatabase, options: DiscordChatlogServiceOptions) {
        this.#messages = messages;
        this.#database = database;
        this.#guildSettings = options.guildSettingsUrl;
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMessageUpdate(this.#handleMessageUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMessageDelete(this.#handleMessageDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#messages.handleMessageDeleteBulk(this.#handleMessageDeleteBulk.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #shouldChatlog(message: Pick<discordeno.DiscordMessage, 'guild_id' | 'channel_id'>): Promise<boolean> {
        if (message.guild_id === undefined)
            return false;

        const settingsResponse = await fetch(new URL(message.guild_id, this.#guildSettings).toString());
        const body = await settingsResponse.json();
        const settings = guildSerializer.read(JSON.stringify(body));
        return settings.enableChatlogging;
    }

    async #handleMessageCreate(message: discordeno.DiscordMessage): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        await this.#database.add({
            attachments: message.attachments.map(a => a.url),
            channelid: message.channel_id,
            content: message.content ?? '',
            embeds: message.embeds,
            guildid: message.guild_id ?? '0',
            msgid: message.id,
            userid: message.author.id
        }, ChatLogType.CREATE);
    }

    async #handleMessageUpdate(message: discordeno.DiscordMessage): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        await this.#database.add({
            attachments: message.attachments.map(a => a.url),
            channelid: message.channel_id,
            content: message.content ?? '',
            embeds: message.embeds,
            guildid: message.guild_id ?? '0',
            msgid: message.id,
            userid: message.author.id
        }, ChatLogType.UPDATE);

    }

    async #handleMessageDelete(message: discordeno.DiscordMessageDelete): Promise<void> {
        await this.#handleMessageDeleteBulk({
            ...message,
            ids: [message.id]
        });
    }

    async #handleMessageDeleteBulk(message: discordeno.DiscordMessageDeleteBulk): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        const chatlogs = await this.#database.get(message.ids, message.channel_id);
        await Promise.all(
            chatlogs.map(chatlog => this.#database.add(chatlog, ChatLogType.DELETE))
        );
    }
}

interface DiscordChatlogServiceOptions {
    readonly guildSettingsUrl: string;
}