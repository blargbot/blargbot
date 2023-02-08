import { getMessageComponentLimit } from './getMessageComponentLimit.js';

export interface EmbedOptions {
    readonly title?: string | null;
    readonly description?: string | null;
    readonly fields?: ReadonlyArray<{
        readonly name?: string | null;
        readonly value?: string | null;
    }> | null;
    readonly author?: {
        readonly name?: string | null;
    } | null;
    readonly footer?: {
        readonly text?: string | null;
    } | null;
}

export function checkEmbedSize(embed: Iterable<EmbedOptions> | undefined): boolean {
    if (embed === undefined)
        return true;
    for (const [value, limit] of getEmbedValueLimits(embed))
        if (value !== undefined && value !== null && value.length > limit)
            return false;

    return true;
}

function* getEmbedValueLimits(embeds: Iterable<EmbedOptions>): IterableIterator<[value: { length: number; } | null | undefined, limit: number]> {
    const allValues: string[] = [];
    const append = <T>(value: T): T => {
        if (typeof value === 'string')
            allValues.push(value);
        return value;
    };

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    for (const embed of embeds) {
        yield [append(embed.title), getMessageComponentLimit('embed.title')];
        yield [append(embed.description), getMessageComponentLimit('embed.description')];
        yield [embed.fields, getMessageComponentLimit('embed.fields')];
        for (const field of embed.fields ?? []) {
            yield [append(field.name), getMessageComponentLimit('embed.field.name')];
            yield [append(field.value), getMessageComponentLimit('embed.field.value')];
        }
        yield [append(embed.footer?.text), getMessageComponentLimit('embed.footer.text')];
        yield [append(embed.author?.name), getMessageComponentLimit('embed.author.name')];
    }

    yield [allValues.join(''), getMessageComponentLimit('embeds')];

}
