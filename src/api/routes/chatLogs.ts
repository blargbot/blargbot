import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { parse } from '@blargbot/core/utils';
import { ChatLog, ChatLogChannel, ChatLogIndex, ChatLogRole, ChatLogUser } from '@blargbot/domain/models';
import { APIEmbed } from 'discord-api-types/v9';

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

        for (const message of result.messages)
            await this.#parseTags(message, result);

        return this.ok(result);
    }

    async #parseTagsInString(content: string, guildId: string, index: ExpandedChatLogIndex): Promise<void> {
        const tagRegex = /<[^<>\s]+>/g;
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            let id: string | undefined;
            if ((id = parse.entityId(match[0], '@&')) !== undefined)
                index.parsedRoles[id] ??= await this.#getChatLogRole(guildId, id);
            else if ((id = parse.entityId(match[0], '@!')) !== undefined)
                index.parsedUsers[id] ??= await this.#getChatLogUser(id);
            else if ((id = parse.entityId(match[0], '@')) !== undefined)
                index.parsedUsers[id] ??= await this.#getChatLogUser(id);
            else if ((id = parse.entityId(match[0], '#')) !== undefined)
                index.parsedChannels[id] ??= await this.#getChatLogChannel(id);
        }
    }

    async #parseTags(message: ChatLog, index: ExpandedChatLogIndex): Promise<void> {
        index.parsedUsers[message.userid] ??= await this.#getChatLogUser(message.userid);
        index.parsedChannels[message.channelid] ??= await this.#getChatLogChannel(message.channelid);
        await this.#parseTagsInString(message.content, message.guildid, index);
        for (const embed of message.embeds as APIEmbed[]) {
            if (embed.title !== undefined)
                await this.#parseTagsInString(embed.title, message.guildid, index);
            if (embed.description !== undefined)
                await this.#parseTagsInString(embed.description, message.guildid, index);
            for (const field of embed.fields ?? []) {
                await this.#parseTagsInString(field.name, message.guildid, index);
                await this.#parseTagsInString(field.value, message.guildid, index);
            }
        }
    }

    async #getChatLogRole(guildId: string, id: string): Promise<ChatLogRole> {
        const role = await this.#api.util.getRole(guildId, id);
        return {
            id: id,
            color: role?.color,
            name: role?.name
        };
    }

    async #getChatLogChannel(id: string): Promise<ChatLogChannel> {
        const channel = await this.#api.util.getChannel(id);
        return {
            id,
            name: channel === undefined ? undefined : 'name' in channel ? channel.name : undefined,
            type: channel?.type
        };
    }

    async #getChatLogUser(userId: string): Promise<ChatLogUser> {
        const dbUser = await this.#api.database.users.get(userId);
        if (dbUser !== undefined) {
            return {
                id: userId,
                avatarURL: dbUser.avatarURL,
                discriminator: dbUser.discriminator,
                username: dbUser.username
            };
        }

        const apiUser = await this.#api.util.getUser(userId);
        return {
            id: userId,
            avatarURL: apiUser?.avatarURL,
            discriminator: apiUser?.discriminator,
            username: apiUser?.username
        };
    }
}

interface ExpandedChatLogIndex extends ChatLogIndex {
    readonly messages: readonly ChatLog[];
    readonly parsedUsers: Record<string, ChatLogUser>;
    readonly parsedChannels: Record<string, ChatLogChannel>;
    readonly parsedRoles: Record<string, ChatLogRole>;
}
