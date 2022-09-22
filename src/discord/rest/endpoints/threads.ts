import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { jsonBody } from '../requests/jsonBody';
import { RESTPostAPIChannelMessageAttachment } from './messages';
import { auditReasonHeader } from './util';

export default {
    listActive: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildThreadsResult>()
        .setRoute(x => `guilds/${x.guildId}/threads/active`)
        .setJsonResponse()
        .build(),
    listPublicArchived: new EndpointBuilder<{ channelId: string; } & discord.RESTGetAPIChannelThreadsArchivedQuery, discord.RESTGetAPIChannelUsersThreadsArchivedResult>()
        .setRoute(x => `channels/${x.channelId}/threads/archived/public`)
        .setQuery(({ channelId, ...query }) => query)
        .setJsonResponse()
        .build(),
    listPrivateArchived: new EndpointBuilder<{ channelId: string; } & discord.RESTGetAPIChannelThreadsArchivedQuery, discord.RESTGetAPIChannelUsersThreadsArchivedResult>()
        .setRoute(x => `channels/${x.channelId}/threads/archived/private`)
        .setQuery(({ channelId, ...query }) => query)
        .setJsonResponse()
        .build(),
    listJoinedPrivateArchived: new EndpointBuilder<{ channelId: string; } & discord.RESTGetAPIChannelThreadsArchivedQuery, discord.RESTGetAPIChannelUsersThreadsArchivedResult>()
        .setRoute(x => `channels/${x.channelId}/users/@me/threads/archived/private`)
        .setQuery(({ channelId, ...query }) => query)
        .setJsonResponse()
        .build(),
    join: new EndpointBuilder<{ channelId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/thread-members/@me`)
        .setMethod('put')
        .setEmptyResponse()
        .build(),
    leave: new EndpointBuilder<{ channelId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/thread-members/@me`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    addMember: new EndpointBuilder<{ channelId: string; userId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/thread-members/${x.userId}`)
        .setMethod('put')
        .setEmptyResponse()
        .build(),
    removeMember: new EndpointBuilder<{ channelId: string; userId: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/thread-members/${x.userId}`)
        .setMethod('delete')
        .setEmptyResponse()
        .build(),
    getMember: new EndpointBuilder<{ channelId: string; userId: string; }, discord.APIThreadMember>()
        .setRoute(x => `channels/${x.channelId}/thread-members/${x.userId}`)
        .setJsonResponse()
        .build(),
    listMembers: new EndpointBuilder<{ channelId: string; userId: string; }, discord.RESTGetAPIChannelThreadMembersResult>()
        .setRoute(x => `channels/${x.channelId}/thread-members`)
        .setJsonResponse()
        .build(),
    startInMessage: new EndpointBuilder<{ channelId: string; messageId: string; auditReason?: string; } & discord.RESTPostAPIChannelMessagesThreadsJSONBody, discord.RESTPostAPIChannelMessagesThreadsResult>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/threads`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, messageId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    startInChannel: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPostAPIChannelThreadsJSONBody, discord.RESTPostAPIChannelThreadsResult>()
        .setRoute(x => `channels/${x.channelId}/threads`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    startInForum: new EndpointBuilder<{ channelId: string; auditReason?: string; message: { attachments?: RESTPostAPIChannelMessageAttachment[]; } & Omit<discord.RESTPostAPIChannelMessageJSONBody, 'attachments'>; } & Omit<discord.RESTPostAPIGuildForumThreadsJSONBody, 'message'>, discord.RESTPostAPIChannelThreadsResult>()
        .setRoute(x => `channels/${x.channelId}/threads`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setMultipartBody(function* ({ channelId, message, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    message: {
                        ...message,
                        attachments: message.attachments?.map(a => ({
                            id: a.id,
                            description: a.description,
                            filename: a.filename
                        }))
                    }
                } as discord.RESTPostAPIGuildForumThreadsJSONBody)
            };
            if (message.attachments !== undefined) {
                for (const attachment of message.attachments) {
                    const content = attachment.content;
                    yield {
                        name: `files[${attachment.id}]`,
                        filename: attachment.filename,
                        body: {
                            headers: {
                                'Content-Type': attachment.contentType ?? 'application/octet-stream'
                            },
                            async write(stream) {
                                for await (const chunk of content())
                                    stream.write(chunk);
                            }
                        }
                    };
                }
            }
        })
        .setJsonResponse()
        .build()

};
