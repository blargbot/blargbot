import { ChatLogType } from '@blargbot/chatlog-types';
import type { PartialDiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';
import type { MessageHandle } from '@blargbot/message-hub';

import type DiscordChatlogDatabase from './DiscordChatlogDatabase.js';

type DiscordGatewayMessageBroker = PartialDiscordGatewayMessageBroker<
    | 'MESSAGE_CREATE'
    | 'MESSAGE_UPDATE'
    | 'MESSAGE_DELETE'
    | 'MESSAGE_DELETE_BULK'
>;

export class DiscordChatlogService {
    readonly #gateway: DiscordGatewayMessageBroker;
    readonly #database: DiscordChatlogDatabase;
    readonly #handles: Set<MessageHandle>;
    readonly #guildSettings: GuildSettingsHttpClient;

    public constructor(gateway: DiscordGatewayMessageBroker, database: DiscordChatlogDatabase, options: DiscordChatlogServiceOptions) {
        this.#gateway = gateway;
        this.#database = database;
        this.#guildSettings = GuildSettingsHttpClient.from(options.guildSettingsClient ?? options.guildSettingsUrl);
        this.#handles = new Set();
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#gateway.handleMessageCreate(this.#handleMessageCreate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleMessageUpdate(this.#handleMessageUpdate.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleMessageDelete(this.#handleMessageDelete.bind(this)).then(h => this.#handles.add(h)),
            this.#gateway.handleMessageDeleteBulk(this.#handleMessageDeleteBulk.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    async #shouldChatlog(message: Pick<Discord.GatewayMessageCreateDispatchData, 'guild_id' | 'channel_id'>): Promise<boolean> {
        if (message.guild_id === undefined)
            return false;

        const settings = await this.#guildSettings.getSettings({ guildId: message.guild_id });
        return settings.enableChatlogging;
    }

    async #handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        await this.#database.add({
            attachments: message.attachments.map(a => a.url),
            channelid: message.channel_id,
            content: message.content,
            embeds: message.embeds,
            guildid: message.guild_id ?? '0',
            msgid: message.id,
            userid: message.author.id
        }, ChatLogType.CREATE);
    }

    async #handleMessageUpdate(message: Discord.GatewayMessageUpdateDispatchData): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        await this.#database.add({
            attachments: message.attachments?.map(a => a.url) ?? [],
            channelid: message.channel_id,
            content: message.content ?? '',
            embeds: message.embeds ?? [],
            guildid: message.guild_id ?? '0',
            msgid: message.id,
            userid: message.author?.id ?? ''
        }, ChatLogType.UPDATE);

    }

    async #handleMessageDelete(message: Discord.GatewayMessageDeleteDispatchData): Promise<void> {
        await this.#handleMessageDeleteBulk({
            ...message,
            ids: [message.id]
        });
    }

    async #handleMessageDeleteBulk(message: Discord.GatewayMessageDeleteBulkDispatchData): Promise<void> {
        if (!await this.#shouldChatlog(message))
            return;

        const chatlogs = await this.#database.get(message.ids, message.channel_id);
        await Promise.all(
            chatlogs.map(chatlog => this.#database.add(chatlog, ChatLogType.DELETE))
        );
    }
}

interface DiscordChatlogServiceOptions {
    readonly guildSettingsUrl?: string;
    readonly guildSettingsClient?: GuildSettingsHttpClient;
}
