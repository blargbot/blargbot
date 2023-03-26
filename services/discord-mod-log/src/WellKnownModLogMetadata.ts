import type { IJsonConverter, IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';
import type * as discordeno from 'discordeno';

export function* discoverFields(metadata: Record<string, JToken>): Iterable<discordeno.DiscordEmbedField> {
    yield* processMetadata(metadata, modLogWarningMetadataSerializer, createWarningEmbedFields);
    yield* processMetadata(metadata, modLogPardonMetadataSerializer, createPardonEmbedFields);
}

const modLogWarningMetadataSerializer = json.object({
    warning: json.object({
        count: json.number,
        total: json.number
    })
});
function* createWarningEmbedFields({ warning: { count, total } }: IJsonConverterType<typeof modLogWarningMetadataSerializer>): Iterable<discordeno.DiscordEmbedField> {
    yield {
        name: 'Warnings',
        value: `Assigned: ${count}\nNew Total: ${total}`,
        inline: true
    };
}

const modLogPardonMetadataSerializer = json.object({
    pardon: json.object({
        count: json.number,
        total: json.number
    })
});
function* createPardonEmbedFields({ pardon: { count, total } }: IJsonConverterType<typeof modLogPardonMetadataSerializer>): Iterable<discordeno.DiscordEmbedField> {
    yield {
        name: 'Pardons',
        value: `Assigned: ${count}\nNew Total: ${total}`,
        inline: true
    };
}

function* processMetadata<T>(metadata: Record<string, JToken>, serializer: IJsonConverter<T>, reader: (value: T) => Iterable<discordeno.DiscordEmbedField>): Iterable<discordeno.DiscordEmbedField> {
    const result = serializer.fromJson(metadata);
    if (result.success)
        yield* reader(result.value);
}
