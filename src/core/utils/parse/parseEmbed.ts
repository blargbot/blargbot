import { MalformedEmbed, TypeMappingImpl } from '@blargbot/core/types';
import { discord, mapping } from '@blargbot/core/utils';
import Color from 'color';
import { EmbedOptions } from 'eris';

import { parseColor } from './parseColor';

export function parseEmbed(embedText: undefined, allowMalformed?: true): undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed?: true): Array<EmbedOptions | MalformedEmbed> | undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed: false): EmbedOptions[] | undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed = true): Array<EmbedOptions | MalformedEmbed> | undefined {
    if (embedText === undefined || embedText.trim().length === 0)
        return undefined;

    const embeds = mapEmbeds(embedText);
    if (!embeds.valid)
        return undefined;

    const results = Array.isArray(embeds.value) ? embeds.value : [embeds.value];
    if (!allowMalformed && results.some(r => 'malformed' in r))
        return undefined;

    return results;

}

const mapEmbedCore = mapping.object<EmbedOptions>({
    author: mapping.object<Exclude<EmbedOptions['author'], undefined>>({
        icon_url: mapping.string.optional,
        name: mapping.string.optional.map(v => v ?? ''),
        url: mapping.string.optional
    }, { strict: false }).optional,
    color: mapping.choice<number[]>(
        mapping.number,
        v => {
            if (typeof v !== 'string')
                return mapping.failed;
            const parsed = parseColor(v);
            if (parsed === undefined)
                return mapping.failed;
            return mapping.success(parsed);
        },
        mapping.tuple<[number, number, number]>([
            mapping.number,
            mapping.number,
            mapping.number
        ]).map(v => Color.rgb(...v).value()),
        mapping.regex<`#${number}`>(/^#\d+$/).map(v => parseInt(v.slice(1), 16))
    ).optional,
    description: mapping.string.optional,
    fields: mapping.array(mapping.object<Exclude<EmbedOptions['fields'], undefined>[number]>({
        inline: mapping.boolean.optional,
        name: mapping.string,
        value: mapping.string
    }, { strict: false })).optional,
    footer: mapping.object<Exclude<EmbedOptions['footer'], undefined>>({
        icon_url: mapping.string.optional,
        text: mapping.string.optional.map(v => v ?? '')
    }, { strict: false }).optional,
    image: mapping.object<Exclude<EmbedOptions['image'], undefined>>({
        url: mapping.string.optional
    }, { strict: false }).optional,
    thumbnail: mapping.object<Exclude<EmbedOptions['thumbnail'], undefined>>({
        url: mapping.string.optional
    }, { strict: false }).optional,
    timestamp: mapping.choice<Array<Exclude<EmbedOptions['timestamp'], undefined>>>(
        mapping.string,
        mapping.date
    ).optional,
    title: mapping.string.optional,
    url: mapping.string.optional
}, { strict: false });

const mapMalformedEmbed: TypeMappingImpl<MalformedEmbed> = value => mapping.success({
    fields: [{ name: 'Malformed JSON', value: discord.overflowText('embed.field.value', JSON.stringify(value), '...') }],
    malformed: true
});

const mapEmbeds = mapping.choice(
    mapping.json(mapping.choice(
        mapping.array(mapping.choice(
            mapEmbedCore,
            mapMalformedEmbed
        )),
        mapEmbedCore,
        mapMalformedEmbed
    )),
    mapMalformedEmbed
);
