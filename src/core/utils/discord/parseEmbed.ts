import { MessageEmbedOptions } from 'discord.js';

import * as mapping from '../mapping';

export function parseEmbed(embedText?: string): (MessageEmbedOptions & { malformed?: true; }) | undefined {
    if (embedText === undefined || embedText.length === 0)
        return undefined;

    const mapped = mapEmbed(embedText);
    return mapped.valid
        ? mapped.value
        : { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
}

const mapEmbed = mapping.mapJson(
    mapping.mapObject<MessageEmbedOptions>({
        author: mapping.mapObject<MessageEmbedOptions['author'] | undefined>({
            icon_url: mapping.mapOptionalString,
            name: mapping.mapString,
            url: mapping.mapOptionalString,
            iconURL: [undefined],
            proxyIconURL: [undefined],
            proxy_icon_url: [undefined]
        }, { ifUndefined: mapping.result.undefined }),
        color: mapping.mapOptionalNumber,
        description: mapping.mapOptionalString,
        fields: mapping.mapArray(
            mapping.mapObject<Exclude<MessageEmbedOptions['fields'], undefined>[number]>({
                inline: mapping.mapOptionalBoolean,
                name: mapping.mapString,
                value: mapping.mapString
            }),
            { ifUndefined: mapping.result.undefined }
        ),
        footer: mapping.mapObject<MessageEmbedOptions['footer'] | undefined>({
            icon_url: mapping.mapOptionalString,
            text: mapping.mapString,
            iconURL: [undefined],
            proxyIconURL: [undefined],
            proxy_icon_url: [undefined]
        }, { ifUndefined: mapping.result.undefined }),
        image: mapping.mapObject<MessageEmbedOptions['image'] | undefined>({
            url: mapping.mapOptionalString,
            height: [undefined],
            proxyURL: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }, { ifUndefined: mapping.result.undefined }),
        thumbnail: mapping.mapObject<MessageEmbedOptions['thumbnail'] | undefined>({
            url: mapping.mapOptionalString,
            height: [undefined],
            proxyURL: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }, { ifUndefined: mapping.result.undefined }),
        timestamp: mapping.mapOptionalDate,
        title: mapping.mapOptionalString,
        url: mapping.mapOptionalString,
        video: [undefined]
    })
);
