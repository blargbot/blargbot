import { EmbedAuthorOptions, EmbedField, EmbedFooterOptions, EmbedImageOptions, EmbedOptions } from 'eris';
import { mapping } from '../mapping';

export function parseEmbed(embedText?: string): (EmbedOptions & { malformed?: true; }) | undefined {
    if (embedText === undefined || embedText.length === 0)
        return undefined;

    const mapped = mapEmbed(embedText);
    return mapped.valid
        ? mapped.value
        : { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
}

const mapEmbed = mapping.json(
    mapping.object<EmbedOptions>({
        author: mapping.object<EmbedAuthorOptions | undefined>({
            icon_url: mapping.optionalString,
            name: mapping.string,
            url: mapping.optionalString
        }, { ifUndefined: mapping.result.undefined }),
        color: mapping.optionalNumber,
        description: mapping.optionalString,
        fields: mapping.array(
            mapping.object<EmbedField>({
                inline: mapping.optionalBoolean,
                name: mapping.string,
                value: mapping.string
            }),
            { ifUndefined: mapping.result.undefined }
        ),
        footer: mapping.object<EmbedFooterOptions | undefined>({
            icon_url: mapping.optionalString,
            text: mapping.string
        }, { ifUndefined: mapping.result.undefined }),
        image: mapping.object<EmbedImageOptions | undefined>({
            url: mapping.optionalString
        }, { ifUndefined: mapping.result.undefined }),
        thumbnail: mapping.object<EmbedImageOptions | undefined>({
            url: mapping.optionalString
        }, { ifUndefined: mapping.result.undefined }),
        timestamp: mapping.optionalString,
        title: mapping.optionalString,
        url: mapping.optionalString
    })
);
