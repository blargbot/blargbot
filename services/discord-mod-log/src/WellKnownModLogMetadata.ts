import type discordeno from '@blargbot/discordeno';
import type { IJsonConverter, IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';

export async function discoverFields(metadata: Record<string, JToken>): Promise<Iterable<discordeno.DiscordEmbedField>> {
    const result = [];
    for await (const field of discoverFieldsIter(metadata))
        result.push(field);
    return result;
}

async function* discoverFieldsIter(metadata: Record<string, JToken>): AsyncIterable<discordeno.DiscordEmbedField> {
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

async function* processMetadata<T>(metadata: Record<string, JToken>, serializer: IJsonConverter<T>, reader: (value: T) => Iterable<discordeno.DiscordEmbedField>): AsyncIterable<discordeno.DiscordEmbedField> {
    const result = await serializer.fromJson(metadata);
    if (result.success)
        yield* reader(result.value);
}
