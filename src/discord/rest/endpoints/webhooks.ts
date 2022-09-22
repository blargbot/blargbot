import type discord from 'discord-api-types/v10';

import { Body, EndpointBuilder } from '../requests';
import { jsonBody } from '../requests/jsonBody';
import { RESTPatchAPIChannelMessageAttachment, RESTPostAPIChannelMessageAttachment } from './messages';
import { auditReasonHeader } from './util';

export default {
    get: new EndpointBuilder<{ webhookId: string; }, discord.RESTGetAPIWebhookResult>()
        .setRoute(x => `webhooks/${x.webhookId}`)
        .setJsonResponse()
        .build(),
    getWithToken: new EndpointBuilder<{ webhookId: string; token: string; }, discord.RESTGetAPIWebhookWithTokenResult>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}`)
        .setJsonResponse()
        .build(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    getMessage: new EndpointBuilder<{ webhookId: string; token: string; messageId: string; /* TODO this should come from discord api types */ thread_id?: string; }, discord.RESTGetAPIWebhookWithTokenMessageResult>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}/messages/${x.messageId}`)
        .setQuery(({ webhookId, token, messageId, ...query }) => query)
        .setJsonResponse()
        .build(),
    listInChannel: new EndpointBuilder<{ channelId: string; }, discord.RESTGetAPIChannelWebhooksResult>()
        .setRoute(x => `channels/${x.channelId}/webhooks`)
        .setJsonResponse()
        .build(),
    listInGuild: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildWebhooksResult>()
        .setRoute(x => `guilds/${x.guildId}/webhooks`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ channelId: string; auditReason?: string; } & discord.RESTPostAPIChannelWebhookJSONBody, discord.RESTPostAPIChannelWebhookResult>()
        .setRoute(x => `channels/${x.channelId}/webhooks`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ channelId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ webhookId: string; auditReason?: string; } & discord.RESTPatchAPIWebhookJSONBody, discord.RESTPatchAPIWebhookResult>()
        .setRoute(x => `webhooks/${x.webhookId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ webhookId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    updateWithToken: new EndpointBuilder<{ webhookId: string; token: string; auditReason?: string; } & discord.RESTPatchAPIWebhookWithTokenJSONBody, discord.RESTPatchAPIWebhookWithTokenResult>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ webhookId, token, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    updateMessage: new EndpointBuilder<{ webhookId: string; token: string; messageId: string; /* TODO this should come from discord api types */ thread_id?: string; attachments?: readonly RESTPatchAPIChannelMessageAttachment[] | null; } & Omit<discord.RESTPatchAPIWebhookWithTokenMessageJSONBody, 'attachments'>, discord.RESTPatchAPIWebhookWithTokenMessageResult>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}/messages/${x.messageId}`)
        .setMethod('patch')
        .setQuery(x => ({ thread_id: x.thread_id }))
        .setMultipartBody(function* ({ webhookId, token, messageId, thread_id: _, attachments, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    attachments: attachments?.map(a => ({
                        id: a.id,
                        description: a.description,
                        filename: a.filename
                    })) ?? attachments
                } as discord.RESTPatchAPIWebhookWithTokenMessageJSONBody)
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
    delete: new EndpointBuilder<{ webhookId: string; auditReason?: string; }, void>()
        .setRoute(x => `webhooks/${x.webhookId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    deleteWithToken: new EndpointBuilder<{ webhookId: string; token: string; auditReason?: string; }, void>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    deleteMessage: new EndpointBuilder<{ webhookId: string; token: string; messageId: string; /* TODO this should come from discord api types */ thread_id?: string; }, void>()
        .setRoute(x => `webhooks/${x.webhookId}/${x.token}/messages/${x.messageId}`)
        .setMethod('delete')
        .setQuery(x => ({ thread_id: x.thread_id }))
        .setEmptyResponse()
        .build(),
    execute: new EndpointBuilder<{ wehbookId: string; token: string; attachments?: readonly RESTPostAPIChannelMessageAttachment[]; } & Omit<discord.RESTPostAPIWebhookWithTokenQuery, 'wait'> & Omit<discord.RESTPostAPIWebhookWithTokenJSONBody, 'attachments'>, void>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id }))
        .setMultipartBody(function* ({ wehbookId, token, thread_id: _, attachments, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    attachments: attachments?.map(a => ({
                        id: a.id,
                        description: a.description,
                        filename: a.filename
                    }))
                } as discord.RESTPostAPIWebhookWithTokenJSONBody)
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
        .setEmptyResponse()
        .build(),
    executeWait: new EndpointBuilder<{ wehbookId: string; token: string; attachments?: readonly RESTPostAPIChannelMessageAttachment[]; } & Omit<discord.RESTPostAPIWebhookWithTokenQuery, 'wait'> & Omit<discord.RESTPostAPIWebhookWithTokenJSONBody, 'attachments'>, discord.RESTPostAPIWebhookWithTokenWaitResult>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id, wait: true }))
        .setMultipartBody(function* ({ wehbookId, token, thread_id: _, attachments, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody({
                    ...body,
                    attachments: attachments?.map(a => ({
                        id: a.id,
                        description: a.description,
                        filename: a.filename
                    }))
                } as discord.RESTPostAPIWebhookWithTokenJSONBody)
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
    executeSlack: new EndpointBuilder<{ wehbookId: string; token: string; body: Body; } & Omit<discord.RESTPostAPIWebhookWithTokenSlackQuery, 'wait'>, void>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}/slack`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id }))
        .setBody(x => x.body)
        .setEmptyResponse()
        .build(),
    executeSlackWait: new EndpointBuilder<{ wehbookId: string; token: string; body: Body; } & Omit<discord.RESTPostAPIWebhookWithTokenSlackQuery, 'wait'>, discord.RESTPostAPIWebhookWithTokenSlackWaitResult>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}/slack`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id, wait: true }))
        .setBody(x => x.body)
        .setJsonResponse()
        .build(),
    executeGitHub: new EndpointBuilder<{ wehbookId: string; token: string; body: Body; } & Omit<discord.RESTPostAPIWebhookWithTokenGitHubQuery, 'wait'>, void>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}/github`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id }))
        .setBody(x => x.body)
        .setEmptyResponse()
        .build(),
    executeGitHubWait: new EndpointBuilder<{ wehbookId: string; token: string; body: Body; } & Omit<discord.RESTPostAPIWebhookWithTokenGitHubQuery, 'wait'>, discord.RESTPostAPIWebhookWithTokenGitHubWaitResult>()
        .setRoute(x => `webhooks/${x.wehbookId}/${x.token}/github`)
        .setMethod('post')
        .setQuery(x => ({ thread_id: x.thread_id, wait: true }))
        .setBody(x => x.body)
        .setJsonResponse()
        .build()
};
