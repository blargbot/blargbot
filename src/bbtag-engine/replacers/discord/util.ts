import { parse } from '../../parse.js';
import type { SendEmbed } from './locals.js';

export interface ParseEmbedOptions {
    allowMalformed?: boolean;
}

export type EmbedParser = (json: string | undefined, options?: ParseEmbedOptions) => SendEmbed[] | undefined;

export function createEmbedParser(colorConverter: (text: string) => number | undefined): EmbedParser {
    const memberAdapters = ([
        { key: 'author', parse: toEmbedAuthor },
        { key: 'color', parse: toEmbedColor },
        { key: 'description', parse: toEmbedDescription },
        { key: 'fields', parse: toEmbedFields },
        { key: 'footer', parse: toEmbedFooter },
        { key: 'image', parse: toEmbedImage },
        { key: 'thumbnail', parse: toEmbedImage },
        { key: 'timestamp', parse: toEmbedTimestamp },
        { key: 'title', parse: toEmbedTitle },
        { key: 'url', parse: toEmbedUrl }
    ] as const).map(x => (embed: JObject, result: SendEmbed) => tryMap(embed, result, x.key, x.parse));

    return function parseEmbed(json: string | undefined, options?: ParseEmbedOptions): SendEmbed[] | undefined {
        if (json === undefined || json.trim().length === 0)
            return undefined;
        const allowMalformed = options?.allowMalformed ?? true;

        let parsed = safeJsonParse(json);
        if (typeof parsed !== 'object' || parsed === null)
            return allowMalformed ? [malformed(json)] : undefined;
        if (!Array.isArray(parsed))
            parsed = [parsed];

        const result = parsed.map(embed => {
            if (typeof embed !== 'object' || embed === null || Array.isArray(embed))
                return allowMalformed ? malformed(JSON.stringify(embed)) : undefined;
            const result: SendEmbed = {};
            for (const adapter of memberAdapters) {
                if (!adapter(embed, result))
                    return allowMalformed ? malformed(JSON.stringify(embed)) : undefined;
            }
            return result;
        });

        if (result.includes(undefined))
            return undefined;
        return result as Array<Exclude<typeof result[number], undefined>>;
    };

    function tryMap<P extends keyof SendEmbed>(embed: JObject, result: SendEmbed, key: P, parser: (value: JToken | undefined) => SendEmbed[P] | false): boolean {
        const parsed = parser(embed[key]);
        if (parsed === false) return false;
        if (parsed !== undefined) result[key] = parsed;
        return true;
    }

    function safeJsonParse(json: string): JToken | undefined {
        try {
            return JSON.parse(json);
        } catch {
            return undefined;
        }
    }

    function malformed(json: string): SendEmbed {
        if (json.length > 1024)
            json = `${json.slice(0, 1021)}...`;
        return { fields: [{ name: 'Malformed JSON', value: json }] };
    }

    function isStringOrUndefined(value: unknown): value is string | undefined {
        return value === undefined || typeof value === 'string';
    }
    function isBooleanOrUndefined(value: unknown): value is boolean | undefined {
        return value === undefined || typeof value === 'boolean';
    }
    function isJObject(value: JToken): value is JObject {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    function parseHex(value: string): number | undefined {
        return /^#[a-f\d]+$/i.test(value) ? parse.int(value.slice(1), { radix: 16 }) : undefined;
    }
    function toEmbedAuthor(value: JToken | undefined): SendEmbed['author'] | false {
        if (value === undefined) return undefined;
        if (!isJObject(value)) return false;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { icon_url, name = '', url } = value;
        if (!isStringOrUndefined(icon_url)) return false;
        if (!isStringOrUndefined(name)) return false;
        if (!isStringOrUndefined(url)) return false;
        return { icon_url, name, url };
    }
    function toEmbedColor(value: JToken | undefined): SendEmbed['color'] | false {
        if (value === undefined) return undefined;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return colorConverter(value) ?? parse.int(value) ?? parseHex(value) ?? false;
        if (Array.isArray(value) && value.length === 3) {
            let color = 0;
            for (let item of value) {
                if (typeof item === 'string') {
                    if (!/^\d+$/.test(item)) return false;
                    item = parseInt(item);
                }
                if (typeof item !== 'number') return false;
                if (item < 0 || item >= 256) return false;
                color = color << 8 | item;
            }
            return color;
        }
        return false;
    }
    function toEmbedDescription(value: JToken | undefined): SendEmbed['description'] | false {
        if (isStringOrUndefined(value)) return value;
        return false;
    }
    function toEmbedFields(value: JToken | undefined): SendEmbed['fields'] | false {
        if (value === undefined) return value;
        if (!Array.isArray(value)) return false;
        const result = [];
        for (const item of value) {
            if (!isJObject(item)) return false;
            const { inline, name, value } = item;
            if (!isBooleanOrUndefined(inline)) return false;
            if (typeof name !== 'string') return false;
            if (typeof value !== 'string') return false;
            result.push({ inline, name, value });
        }
        return result;
    }
    function toEmbedFooter(value: JToken | undefined): SendEmbed['footer'] | false {
        if (value === undefined) return value;
        if (!isJObject(value)) return false;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { icon_url, text = '' } = value;
        if (!isStringOrUndefined(icon_url)) return false;
        if (typeof text !== 'string') return false;
        return { icon_url, text };
    }
    function toEmbedImage(value: JToken | undefined): SendEmbed['image'] | false {
        if (value === undefined) return value;
        if (!isJObject(value)) return false;
        const { url } = value;
        if (!isStringOrUndefined(url)) return false;
        return { url };
    }
    function toEmbedTimestamp(value: JToken | undefined): SendEmbed['timestamp'] | false {
        if (value === undefined) return undefined;
        if (typeof value === 'number') return Temporal.Instant.fromEpochMilliseconds(value);
        if (typeof value === 'string') {
            try {
                return Temporal.Instant.from(value);
            } catch { /* NO-OP */ }
            try {
                return Temporal.PlainDateTime.from(value).toZonedDateTime('UTC').toInstant();
            } catch {
                return false;
            }
        }
        return false;
    }
    function toEmbedTitle(value: JToken | undefined): SendEmbed['title'] | false {
        if (isStringOrUndefined(value)) return value;
        return false;
    }
    function toEmbedUrl(value: JToken | undefined): SendEmbed['url'] | false {
        if (isStringOrUndefined(value)) return value;
        return false;
    }
}
