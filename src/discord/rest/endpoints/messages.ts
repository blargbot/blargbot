import discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { jsonBody } from '../requests/jsonBody';
import { auditReasonHeader } from './util';

export interface RESTPostAPIChannelMessageAttachment extends Pick<discord.APIAttachment, 'id' | 'filename' | 'description'> {
    readonly contentType?: string;
    readonly content: () => Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
}
export interface RESTPatchAPIChannelMessageAttachment extends Pick<discord.APIAttachment, 'id' | 'filename' | 'description'> {
    readonly contentType?: string;
    readonly content?: () => Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
}

export default {
    list: new EndpointBuilder<{ channelId: string; } & discord.RESTGetAPIChannelMessagesQuery, discord.RESTGetAPIChannelMessagesResult>()
        .setRoute(x => `channels/${x.channelId}/messages`)
        .setQuery(({ channelId, ...query }) => query)
        .setJsonResponse()
        .build(),
    get: new EndpointBuilder<{ channelId: string; messageId: string; }, discord.RESTGetAPIChannelMessageResult>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}`)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ channelId: string; messageId: string; auditReason?: string; }, void>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    bulkDelete: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPostAPIChannelMessagesBulkDeleteJSONBody, void>()
        .setRoute(x => `channels/${x.channelId}/messages/bulk-delete`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setEmptyResponse()
        .build(),
    create: new EndpointBuilder<{ channelId: string; attachments?: readonly RESTPostAPIChannelMessageAttachment[]; } & Omit<discord.RESTPostAPIChannelMessageJSONBody, 'attachments'>, discord.RESTPostAPIChannelMessageResult>()
        .setRoute(x => `channels/${x.channelId}/messages`)
        .setMethod('post')
        .setMultipartBody(function* ({ channelId, attachments, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    attachments: attachments?.map(a => ({
                        id: a.id,
                        description: a.description,
                        filename: a.filename
                    }))
                } as discord.RESTPostAPIChannelMessageJSONBody)
            };
            if (attachments !== undefined) {
                for (const attachment of attachments) {
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
        .build(),
    update: new EndpointBuilder<{ channelId: string; messageId: string; attachments?: readonly RESTPatchAPIChannelMessageAttachment[] | null; } & Omit<discord.RESTPatchAPIChannelMessageJSONBody, 'attachments'>, discord.RESTPatchAPIChannelMessageResult>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}`)
        .setMethod('patch')
        .setMultipartBody(function* ({ channelId, messageId, attachments, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    attachments: attachments?.map(a => ({
                        id: a.id,
                        description: a.description,
                        filename: a.filename
                    })) ?? attachments
                } as discord.RESTPatchAPIChannelMessageJSONBody)
            };
            if (attachments !== undefined && attachments !== null) {
                for (const attachment of attachments) {
                    if (attachment.content === undefined)
                        continue;
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
        .build(),
    crosspost: new EndpointBuilder<{ channelId: string; messageId: string; }, discord.RESTPostAPIChannelMessageCrosspostResult>()
        .setRoute(x => `channels/${x.channelId}/messages/${x.messageId}/crosspost`)
        .setMethod('post')
        .setJsonResponse()
        .build()
};
