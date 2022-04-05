import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { ChatLog, ChatLogIndex, ChatLogUser } from '@blargbot/domain/models';

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

        this.api.logger.info(`Getting chatlogs for ${id}`);
        this.api.logger.info(logIndex);

        const messages = await this.api.database.chatlogs.getAll(logIndex.channel, logIndex.ids);
        const userCache = new Map<string, ChatLogUser>();

        this.api.logger.info(messages);

        for (const message of messages) {
            try {
                if (!userCache.has(message.userid)) {
                    const dbUser = await this.api.database.users.get(message.userid);
                    if (dbUser !== undefined) {
                        userCache.set(dbUser.userid, {
                            id: dbUser.userid,
                            username: dbUser.username,
                            discriminator: dbUser.discriminator,
                            avatarURL: dbUser.avatarURL
                        });
                    } else {
                        const user = await this.api.util.getUser(message.userid);
                        if (user !== undefined) {
                            userCache.set(message.userid, {
                                id: user.id,
                                username: user.username,
                                discriminator: user.discriminator,
                                avatarURL: user.avatarURL
                            });
                        }
                    }
                }
            } catch {
                userCache.set(message.userid, {
                    id: message.userid,
                    username: 'unknown',
                    discriminator: '0000'
                });
            }
        }

        const expandedLogs: ExpandedChatLogIndex = {
            ...logIndex,
            messages: [...messages],
            parsedUsers: Object.fromEntries(userCache.entries())
        };

        return this.ok(expandedLogs);
    }
}

interface ExpandedChatLogIndex extends ChatLogIndex {
    readonly messages: readonly ChatLog[];
    readonly parsedUsers: Record<string, ChatLogUser>;
}
