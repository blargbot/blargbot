import { MalformedEmbed } from '@core/types';
import { MessageEmbedOptions } from 'discord.js';

import { mapping } from '../mapping';

export function parseEmbed(embedText: string | undefined, allowMalformed: false): MessageEmbedOptions | undefined
export function parseEmbed(embedText: string | undefined, allowMalformed?: true): MessageEmbedOptions | MalformedEmbed | undefined
export function parseEmbed(embedText: string | undefined, allowMalformed = true): MessageEmbedOptions | MalformedEmbed | undefined {
    if (embedText === undefined || embedText.length === 0)
        return undefined;

    const mapped = mapEmbed(embedText);
    return mapped.valid
        ? mapped.value
        : allowMalformed
            ? { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true }
            : undefined;
}

const mapEmbed = mapping.json(
    mapping.object<MessageEmbedOptions>({
        author: mapping.object<MessageEmbedOptions['author'] | undefined>({
            icon_url: mapping.string.optional,
            name: mapping.string,
            url: mapping.string.optional,
            iconURL: [undefined],
            proxyIconURL: [undefined],
            proxy_icon_url: [undefined]
        }).optional,
        color: mapping.number.optional,
        description: mapping.string.optional,
        fields: mapping.array(
            mapping.object<Exclude<MessageEmbedOptions['fields'], undefined>[number]>({
                inline: mapping.boolean.optional,
                name: mapping.string,
                value: mapping.string
            })
        ).optional,
        footer: mapping.object<MessageEmbedOptions['footer'] | undefined>({
            icon_url: mapping.string.optional,
            text: mapping.string,
            iconURL: [undefined],
            proxyIconURL: [undefined],
            proxy_icon_url: [undefined]
        }).optional,
        image: mapping.object<MessageEmbedOptions['image'] | undefined>({
            url: mapping.string.optional,
            height: [undefined],
            proxyURL: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }).optional,
        thumbnail: mapping.object<MessageEmbedOptions['thumbnail'] | undefined>({
            url: mapping.string.optional,
            height: [undefined],
            proxyURL: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }).optional,
        timestamp: mapping.date.optional,
        title: mapping.string.optional,
        url: mapping.string.optional,
        video: [undefined]
    })
);
