import { ChatLogType } from '@blargbot/chat-log-client';
import type Discord from '@blargbot/discord-types';
import { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';

import type ChatLogDatabase from './ChatLogDatabase.js';

export class ChatLogService {
    readonly #database: ChatLogDatabase;
    readonly #guildSettings: GuildSettingsHttpClient;

    public constructor(database: ChatLogDatabase, options: ChatLogServiceOptions) {
        this.#database = database;
        this.#guildSettings = GuildSettingsHttpClient.from(options.guildSettingsClient ?? options.guildSettingsUrl);
    }

    async #shouldLogMessage(message: Pick<Discord.GatewayMessageCreateDispatchData, 'guild_id' | 'channel_id'>): Promise<boolean> {
        if (message.guild_id === undefined)
            return false;

        const settings = await this.#guildSettings.getSettings({ guildId: message.guild_id });
        return settings.enableChatLogging;
    }

    public async handleMessageCreate(message: Discord.GatewayMessageCreateDispatchData): Promise<void> {
        if (!await this.#shouldLogMessage(message))
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
        if (!await this.#shouldLogMessage(message))
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
        if (!await this.#shouldLogMessage(message))
            return;

        const chatLogs = await this.#database.get(message.ids, message.channel_id);
        await Promise.all(
            chatLogs.map(c => this.#database.add(c, ChatLogType.DELETE))
        );
    }
}

interface ChatLogServiceOptions {
    readonly guildSettingsUrl?: string;
    readonly guildSettingsClient?: GuildSettingsHttpClient;
}
