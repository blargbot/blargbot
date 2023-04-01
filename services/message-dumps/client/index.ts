import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';
import type Discord from '@blargbot/discord-types';
import type { IJsonConverter } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

export interface MessageDump {
    readonly id: bigint;
    readonly content?: string;
    readonly embeds?: Discord.APIEmbed[];
    readonly channelId: bigint;
    readonly expiry: Date;
}

export const messageDumpSerializer = json.object<MessageDump>({
    channelId: json.bigint,
    content: json.string.optional,
    embeds: json.array(json.jToken as IJsonConverter<Discord.APIEmbed>).optional,
    expiry: json.date,
    id: json.bigint
});

export class MessageDumpsHttpClient extends defineApiClient({
    getMessageDump: b => b.route<{ id: bigint; }>(x => `${x.id}`)
        .response<MessageDump>(200, messageDumpSerializer.fromBlob)
        .response(404),
    createMessageDump: b => b.route<MessageDump>('POST', '')
        .body(messageDumpSerializer.toBlob)
        .response(204)
}) {

    public static from(options: MessageDumpsHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): MessageDumpsHttpClient {
        if (options instanceof MessageDumpsHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new MessageDumpsHttpClient(options);
    }
}
