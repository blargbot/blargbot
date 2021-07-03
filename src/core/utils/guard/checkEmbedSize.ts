import { EmbedOptions } from 'eris';

export function checkEmbedSize(embed: EmbedOptions | undefined): boolean {
    if (!embed) return true;
    for (const [value = '', limit] of getEmbedValueLimits(embed))
        if (value.length > limit)
            return false;

    return true;

}

function* getEmbedValueLimits(embed: EmbedOptions): IterableIterator<[value: string | unknown[] | undefined, limit: number]> {
    const allValues: unknown[] = [];
    const append = <T>(value: T): T => (allValues.push(value), value);

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    yield [append(embed.title), 256];
    yield [append(embed.description), 2048];
    yield [embed.fields, 25];
    for (const field of embed.fields ?? []) {
        yield [append(field.name), 256];
        yield [append(field.value), 1024];
    }
    yield [append(embed.footer?.text), 2048];
    yield [append(embed.author?.name), 256];

    yield [allValues.join(''), 6000];

}