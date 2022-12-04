import type { Api } from '@blargbot/api/Api.js';
import { BaseRoute } from '@blargbot/api/BaseRoute.js';
import type { ApiResponse } from '@blargbot/api/types.js';
import type { ChatLog, ChatLogIndex, DiscordTagSet } from '@blargbot/domain/models/index.js';
import type Discord from 'discord-api-types/v9';

export class ChatLogsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/chatlogs');

        this.#api = api;

        this.addRoute('/:id', {
            get: ({ request }) => this.getLogs(request.params.id)
        });
    }

    public async getLogs(id: string): Promise<ApiResponse> {
        const logIndex = await this.#api.database.chatlogIndex.get(id);
        if (logIndex === undefined) {
            return this.notFound();
        }

        const messages = await this.#api.database.chatlogs.getAll(logIndex.channel, logIndex.ids);
        const result: ExpandedChatLogIndex = {
            ...logIndex,
            messages,
            parsedChannels: {},
            parsedRoles: {},
            parsedUsers: {}
        };

        for (const message of result.messages) {
            await this.#api.util.loadDiscordTagData(`<@${message.userid}><#${message.channelid}>`, message.guildid, result);
            await this.#api.util.loadDiscordTagData(message.content, message.guildid, result);
            for (const embed of message.embeds as Discord.APIEmbed[]) {
                if (embed.title !== undefined)
                    await this.#api.util.loadDiscordTagData(embed.title, message.guildid, result);
                if (embed.description !== undefined)
                    await this.#api.util.loadDiscordTagData(embed.description, message.guildid, result);
                for (const field of embed.fields ?? []) {
                    await this.#api.util.loadDiscordTagData(field.name, message.guildid, result);
                    await this.#api.util.loadDiscordTagData(field.value, message.guildid, result);
                }
            }
        }

        return this.ok(result);
    }
}

interface ExpandedChatLogIndex extends ChatLogIndex, DiscordTagSet {
    readonly messages: readonly ChatLog[];
}
