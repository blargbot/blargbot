import type { MalformedEmbed } from '@blargbot/core';
import { discord, zodStringToJson } from '@blargbot/core';
import Color from 'color';
import type * as eris from 'eris';
import z from 'zod';

import { parseColor } from './parseColor.js';
import { parseInt } from './parseInt.js';

export function parseEmbed(embedText: undefined, allowMalformed?: true): undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed?: true): Array<eris.EmbedOptions | MalformedEmbed> | undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed: false): eris.EmbedOptions[] | undefined;
export function parseEmbed(embedText: string | undefined, allowMalformed = true): Array<eris.EmbedOptions | MalformedEmbed> | undefined {
    if (embedText === undefined || embedText.trim().length === 0)
        return undefined;

    const embeds = mapEmbeds.safeParse(embedText);
    if (!embeds.success)
        return undefined;

    const results = Array.isArray(embeds.data) ? embeds.data : [embeds.data];
    if (!allowMalformed && results.some(r => 'malformed' in r))
        return undefined;

    return results;
}

function fail(ctx: z.RefinementCtx): never {
    ctx.addIssue('failed');
    return z.NEVER;
}

const mapEmbedCore = z.object({
    author: z.object({
        icon_url: z.string().optional(),
        name: z.string().optional().default(''),
        url: z.string().optional()
    }).optional(),
    color: z.union([
        z.number(),
        z.string().transform((v, ctx) => parseColor(v) ?? fail(ctx)),
        z.string().transform((v, ctx) => parseInt(v) ?? fail(ctx)),
        z.tuple([
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number),
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number),
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number)
        ]).transform(v => Color.rgb(...v).value()),
        z.string().regex(/^#\d+$/).transform(v => parseInt(v.slice(1), { radix: 16 }) ?? NaN)
    ]).optional(),
    description: z.string().optional(),
    fields: z.object({
        inline: z.boolean().optional(),
        name: z.string(),
        value: z.string()
    }).array().optional(),
    footer: z.object({
        icon_url: z.string().optional(),
        text: z.string().optional().default('')
    }).optional(),
    image: z.object({
        url: z.string().optional()
    }).optional(),
    thumbnail: z.object({
        url: z.string().optional()
    }).optional(),
    timestamp: z.union([
        z.iso.date()
    ]).optional(),
    title: z.string().optional(),
    url: z.string().optional()
});

const mapMalformedEmbed = z.unknown().transform(value => ({
    fields: [{ name: 'Malformed JSON', value: discord.overflowText('embed.field.value', JSON.stringify(value), '...') }],
    malformed: true
}));

const mapEmbeddable = z.union([
    mapEmbedCore,
    z.union([mapEmbedCore, mapMalformedEmbed]).array(),
    mapMalformedEmbed
]);

const mapEmbeds = z.union([
    zodStringToJson.pipe(mapEmbeddable),
    mapEmbeddable
]);
