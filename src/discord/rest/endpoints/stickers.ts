import type discord from 'discord-api-types/v10';

import { EndpointBuilder } from '../requests';
import { jsonBody } from '../requests/jsonBody';
import { auditReasonHeader } from './util';

export interface RESTPostAPIGuildStickerFile {
    readonly contentType?: string;
    readonly content: () => Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
}

export default {
    packs: new EndpointBuilder<void, discord.RESTGetNitroStickerPacksResult>()
        .setRoute('sticker-packs')
        .setJsonResponse()
        .build(),
    get: new EndpointBuilder<{ stickerId: string; }, discord.RESTGetAPIStickerResult>()
        .setRoute(x => `stickers/${x.stickerId}`)
        .setJsonResponse()
        .build(),
    listGuild: new EndpointBuilder<{ guildId: string; }, discord.RESTGetAPIGuildStickersResult>()
        .setRoute(x => `guilds/${x.guildId}/stickers`)
        .setJsonResponse()
        .build(),
    getGuild: new EndpointBuilder<{ guildId: string; stickerId: string; }, discord.RESTGetAPIGuildStickerResult>()
        .setRoute(x => `guilds/${x.guildId}/stickers/${x.stickerId}`)
        .setJsonResponse()
        .build(),
    create: new EndpointBuilder<{ guildId: string; auditReason?: string; file: RESTPostAPIGuildStickerFile; } & Omit<discord.RESTPostAPIGuildStickerFormDataBody, 'file'>, discord.RESTPostAPIGuildStickerResult>()
        .setRoute(x => `guilds/${x.guildId}/stickers`)
        .setMethod('post')
        .setHeader(...auditReasonHeader)
        .setMultipartBody(function* ({ guildId, auditReason, file, ...body }) {
            yield {
                name: 'payload_json',
                body: jsonBody(body)
            };
            yield {
                name: 'file',
                body: {
                    headers: {
                        'Content-Type': file.contentType ?? 'application/octet-stream'
                    },
                    async write(stream) {
                        for await (const chunk of file.content())
                            stream.write(chunk);
                    }
                }
            };
        })
        .setJsonResponse()
        .build(),
    update: new EndpointBuilder<{ guildId: string; stickerId: string; auditReason?: string; } & discord.RESTPatchAPIGuildStickerJSONBody, discord.RESTPatchAPIGuildStickerResult>()
        .setRoute(x => `guilds/${x.guildId}/stickers/${x.stickerId}`)
        .setMethod('patch')
        .setHeader(...auditReasonHeader)
        .setJsonBody(({ guildId, stickerId, auditReason, ...body }) => body)
        .setJsonResponse()
        .build(),
    delete: new EndpointBuilder<{ guildId: string; stickerId: string; auditReason?: string; }, void>()
        .setRoute(x => `guilds/${x.guildId}/stickers/${x.stickerId}`)
        .setMethod('delete')
        .setHeader(...auditReasonHeader)
        .setEmptyResponse()
        .build()
};
