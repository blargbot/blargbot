import type { Api } from '@blargbot/api/Api.js';
import { BaseRoute } from '@blargbot/api/BaseRoute.js';
import type { ApiResponse } from '@blargbot/api/types.js';
import type { ChatLog, ChatLogIndex } from '@blargbot/chatlog-types';
import type Discord from '@blargbot/discord-types';
import { markup } from '@blargbot/discord-util';
import type { DiscordTagSet } from '@blargbot/domain/models/index.js';

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

        const messages = [] as ChatLog[];//await this.#api.database.chatlogs.getAll(logIndex.channel, logIndex.ids);
        const tags = await this.#api.util.discoverMessagesEntities(messages.map(message => ({
            guildId: message.guildid,
            content: [
                markup.user(message.userid),
                markup.channel(message.channelid),
                message.content
            ].join('\n'),
            embeds: message.embeds as Discord.APIEmbed[]
        })));

        return this.ok<ExpandedChatLogIndex>({
            ...logIndex,
            ...tags,
            messages
        });
    }
}

interface ExpandedChatLogIndex extends ChatLogIndex, DiscordTagSet {
    readonly messages: readonly ChatLog[];
}
