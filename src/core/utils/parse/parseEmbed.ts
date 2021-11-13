import { mapping } from '@cluster/utils';
import { MalformedEmbed, TypeMappingImpl } from '@core/types';
import { ColorResolvable, Constants, MessageEmbedOptions } from 'discord.js';

export function parseEmbed(embedText: string): MessageEmbedOptions[] | MalformedEmbed[] | undefined {
    if (embedText.trim().length === 0)
        return undefined;

    const embeds = mapEmbeds(embedText);
    if (!embeds.valid)
        return undefined;

    if (Array.isArray(embeds.value))
        return embeds.value;
    return [embeds.value];
}

const mapEmbedCore = mapping.object<MessageEmbedOptions>({
    author: mapping.object<Exclude<MessageEmbedOptions['author'], undefined>>({
        iconURL: mapping.string.optional,
        icon_url: mapping.string.optional,
        name: mapping.string.optional,
        proxyIconURL: mapping.string.optional,
        proxy_icon_url: mapping.string.optional,
        url: mapping.string.optional
    }).optional,
    color: mapping.choice<ColorResolvable[]>(
        mapping.number,
        mapping.in(...Object.keys(Constants.Colors)),
        mapping.tuple<[number, number, number]>([
            mapping.number,
            mapping.number,
            mapping.number
        ]),
        mapping.regex<`#${number}`>(/#\d+/)
    ).optional,
    description: mapping.string.optional,
    fields: mapping.array(mapping.object<Exclude<MessageEmbedOptions['fields'], undefined>[number]>({
        inline: mapping.boolean.optional,
        name: mapping.string,
        value: mapping.string
    })).optional,
    footer: mapping.object<Exclude<MessageEmbedOptions['footer'], undefined>>({
        iconURL: mapping.string.optional,
        icon_url: mapping.string.optional,
        proxyIconURL: mapping.string.optional,
        proxy_icon_url: mapping.string.optional,
        text: mapping.string.optional
    }).optional,
    image: mapping.object<Exclude<MessageEmbedOptions['image'], undefined>>({
        height: mapping.number.optional,
        proxyURL: mapping.string.optional,
        proxy_url: mapping.string.optional,
        url: mapping.string.optional,
        width: mapping.number.optional
    }).optional,
    thumbnail: mapping.object<Exclude<MessageEmbedOptions['thumbnail'], undefined>>({
        url: mapping.string.optional,
        proxyURL: mapping.string.optional,
        proxy_url: mapping.string.optional,
        height: mapping.number.optional,
        width: mapping.number.optional
    }).optional,
    timestamp: mapping.choice<Array<Exclude<MessageEmbedOptions['timestamp'], undefined>>>(
        mapping.number,
        mapping.date
    ).optional,
    title: mapping.string.optional,
    url: mapping.string.optional,
    video: [undefined]
});

const mapMalformedEmbed: TypeMappingImpl<MalformedEmbed> = value => mapping.success({
    fields: [{ name: 'Malformed JSON', value: JSON.stringify(value) }],
    malformed: true
});

const mapEmbeds = mapping.json(mapping.choice(
    mapping.array(mapping.choice(
        mapEmbedCore,
        mapMalformedEmbed
    )),
    mapEmbedCore,
    mapMalformedEmbed
));
