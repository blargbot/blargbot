import { ChatLogType } from '@blargbot/chatlog-types';
import type Discord from '@blargbot/discord-types';
import { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';

import type DiscordChatlogDatabase from './DiscordChatlogDatabase.js';

export class DiscordChatlogService {
    readonly #database: DiscordChatlogDatabase;
    readonly #guildSettings: GuildSettingsHttpClient;

    public constructor(database: DiscordChatlogDatabase, options: DiscordChatlogServiceOptions) {
        this.#database = database;
        this.#guildSettings = GuildSettingsHttpClient.from(options.guildSettingsClient ?? options.guildSettingsUrl);
    }

    async #shouldChatlog(message: Pick<Discord.GatewayMessageCreateDispatchData, 'guild_id' | 'channel_id'>): Promise<boolean> {
        if (message.guild_id === undefined)
            return false;

        const settings = await this.#guildSettings.getSettings({ guildId: message.guild_id });
        return settings.enableChatlogging;
    }

    public async handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
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

    public async handleMessageUpdate(message: Discord.GatewayMessageUpdateDispatchData): Promise<void> {
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

    public async handleMessageDelete(message: Discord.GatewayMessageDeleteDispatchData): Promise<void> {
        await this.handleMessageDeleteBulk({
            ...message,
            ids: [message.id]
        });
    }

    public async handleMessageDeleteBulk(message: Discord.GatewayMessageDeleteBulkDispatchData): Promise<void> {
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
