import { overflowMessageContent } from '@blargbot/discord-util';
import type { TypeMapping } from '@blargbot/mapping';
import { mapping } from '@blargbot/mapping';
import type * as Discord from 'discord-api-types/v10';

import type { BBTagValueConverter } from '../BBTagUtilities.js';

export interface EmbedParserOptions {
    convertToColor: BBTagValueConverter['color'];
    convertToNumber: BBTagValueConverter['int'];
}

export interface EmbedParser {
    (embedText: string | undefined, options?: { allowMalformed?: boolean; }): Discord.APIEmbed[] | undefined;
}

export function createEmbedParser(options: EmbedParserOptions): EmbedParser {
    const mapEmbeds = createEmbedMapper(options);
    return parseEmbed;

    function parseEmbed(embedText: string | undefined, { allowMalformed = false } = {}): Discord.APIEmbed[] | undefined {
        if (embedText === undefined || embedText.trim().length === 0)
            return undefined;

        const embeds = mapEmbeds(embedText);
        if (!embeds.valid)
            return undefined;

        if (!allowMalformed && embeds.value.some(r => typeof r === 'string'))
            return undefined;

        return embeds.value.map(e => typeof e === 'string' ? {
            fields: [{
                name: 'Malformed JSON',
                value: overflowMessageContent('embed.field.value', e, '...')
            }]
        } : e);
    }
}

function createEmbedMapper(options: EmbedParserOptions): TypeMapping<Array<Discord.APIEmbed | string>> {
    const { convertToColor: toColor, convertToNumber: toNumber } = options;
    const mapEmbedCore = mapping.object<Discord.APIEmbed>({
        author: mapping.object({
            icon_url: mapping.string.optional,
            name: mapping.string.optional.map(v => v ?? ''),
            url: mapping.string.optional,
            proxy_icon_url: [undefined]
        }, { strict: false }).optional,
        color: mapping.choice<number[]>(
            mapping.number,
            mapping.string.chain(v => {
                const parsed = toColor(v) ?? toNumber(v);
                return parsed === undefined ? mapping.failed : mapping.success(parsed);
            }),
            mapping.tuple<[r: number, g: number, b: number]>([
                mapping.number,
                mapping.number,
                mapping.number
            ]).map(v => v.reduce((p, c) => (p << 8) + (c & 0xFF), 0)),
            mapping.regex<`#${number}`>(/^#\d+$/).map(v => toNumber(v.slice(1), { radix: 16 }) ?? NaN)
        ).optional,
        description: mapping.string.optional,
        fields: mapping.array(mapping.object<Discord.APIEmbedField>({
            inline: mapping.boolean.optional,
            name: mapping.string,
            value: mapping.string
        }, { strict: false })).optional,
        footer: mapping.object<Discord.APIEmbedFooter>({
            icon_url: mapping.string.optional,
            text: mapping.string.optional.map(v => v ?? ''),
            proxy_icon_url: [undefined]
        }, { strict: false }).optional,
        image: mapping.object<Discord.APIEmbedImage>({
            url: mapping.string,
            height: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }, { strict: false }).optional,
        thumbnail: mapping.object<Discord.APIEmbedThumbnail>({
            url: mapping.string,
            height: [undefined],
            proxy_url: [undefined],
            width: [undefined]
        }, { strict: false }).optional,
        timestamp: mapping.choice<string[]>(
            mapping.string,
            mapping.date.map(d => d.toISOString())
        ).optional,
        title: mapping.string.optional,
        url: mapping.string.optional,
        provider: [undefined],
        video: [undefined],
        type: [undefined]
    }, { strict: false });

    return mapping.choice(
        mapping.json(mapping.choice(
            mapping.array(mapping.choice(
                mapEmbedCore,
                mapping.unknown.map(x => JSON.stringify(x))
            )),
            mapEmbedCore.map(x => [x]),
            mapping.unknown.map(x => [JSON.stringify(x)])
        )),
        mapping.unknown.map(x => [JSON.stringify(x)])
    );

}
