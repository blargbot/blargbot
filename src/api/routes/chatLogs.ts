import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { parse } from '@blargbot/core/utils';
import { ChatLog, ChatLogChannel, ChatLogIndex, ChatLogRole, ChatLogUser } from '@blargbot/domain/models';

export class ChatLogsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/chatlogs');

        this.addRoute('/:id', {
            get: (req) => this.getLogs(req.params.id)
        });
    }

    public async getLogs(id: string): Promise<ApiResponse> {
        const logIndex = await this.api.database.chatlogIndex.get(id);
        if (logIndex === undefined) {
            return this.notFound();
        }

        const messages = await this.api.database.chatlogs.getAll(logIndex.channel, logIndex.ids);
        const result: ExpandedChatLogIndex = {
            ...logIndex,
            messages,
            parsedChannels: {},
            parsedRoles: {},
            parsedUsers: {}
        };

        for (const message of result.messages)
            await this.parseTags(message, result);

        return this.ok(result);
    }

    private async parseTags(message: ChatLog, index: ExpandedChatLogIndex): Promise<void> {
        index.parsedUsers[message.userid] ??= await this.getChatLogUser(message.userid);
        index.parsedChannels[message.channelid] ??= await this.getChatLogChannel(message.channelid);
        const tagRegex = /<[^<>\s]+>/g;
        let match;
        while ((match = tagRegex.exec(message.content)) !== null) {
            let id: string | undefined;
            if ((id = parse.entityId(match[0], '@&')) !== undefined)
                index.parsedRoles[id] ??= await this.getChatLogRole(message.guildid, id);
            else if ((id = parse.entityId(match[0], '@!')) !== undefined)
                index.parsedUsers[id] ??= await this.getChatLogUser(id);
            else if ((id = parse.entityId(match[0], '@')) !== undefined)
                index.parsedUsers[id] ??= await this.getChatLogUser(id);
            else if ((id = parse.entityId(match[0], '#')) !== undefined)
                index.parsedChannels[id] ??= await this.getChatLogChannel(id);
        }
    }

    private async getChatLogRole(guildId: string, id: string): Promise<ChatLogRole> {
        const role = await this.api.util.getRole(guildId, id);
        return {
            id: id,
            color: role?.color,
            name: role?.name
        };
    }

    private async getChatLogChannel(id: string): Promise<ChatLogChannel> {
        const channel = await this.api.util.getChannel(id);
        return {
            id,
            name: channel === undefined ? undefined : 'name' in channel ? channel.name : undefined,
            type: channel?.type
        };
    }

    private async getChatLogUser(userId: string): Promise<ChatLogUser> {
        const dbUser = await this.api.database.users.get(userId);
        if (dbUser !== undefined) {
            return {
                id: userId,
                avatarURL: dbUser.avatarURL,
                discriminator: dbUser.discriminator,
                username: dbUser.username
            };
        }

        const apiUser = await this.api.util.getUser(userId);
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
