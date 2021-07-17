import { EmbedAuthorOptions, EmbedField, EmbedFooterOptions, EmbedImageOptions, EmbedOptions } from 'eris';

import * as mapping from '../mapping';

export function parseEmbed(embedText?: string): (EmbedOptions & { malformed?: true; }) | undefined {
    if (embedText === undefined || embedText.length === 0)
        return undefined;

    const mapped = mapEmbed(embedText);
    return mapped.valid
        ? mapped.value
        : { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
}

const mapEmbed = mapping.mapJson(
    mapping.mapObject<EmbedOptions>({
        author: mapping.mapObject<EmbedAuthorOptions | undefined>({
            icon_url: mapping.mapOptionalString,
            name: mapping.mapString,
            url: mapping.mapOptionalString
        }, { ifUndefined: mapping.result.undefined }),
        color: mapping.mapOptionalNumber,
        description: mapping.mapOptionalString,
        fields: mapping.mapArray(
            mapping.mapObject<EmbedField>({
                inline: mapping.mapOptionalBoolean,
                name: mapping.mapString,
                value: mapping.mapString
            }),
            { ifUndefined: mapping.result.undefined }
        ),
        footer: mapping.mapObject<EmbedFooterOptions | undefined>({
            icon_url: mapping.mapOptionalString,
            text: mapping.mapString
        }, { ifUndefined: mapping.result.undefined }),
        image: mapping.mapObject<EmbedImageOptions | undefined>({
            url: mapping.mapOptionalString
        }, { ifUndefined: mapping.result.undefined }),
        thumbnail: mapping.mapObject<EmbedImageOptions | undefined>({
            url: mapping.mapOptionalString
        }, { ifUndefined: mapping.result.undefined }),
        timestamp: mapping.mapOptionalString,
        title: mapping.mapOptionalString,
        url: mapping.mapOptionalString
    })
);
