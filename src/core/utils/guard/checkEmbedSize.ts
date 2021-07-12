import { EmbedOptions } from 'eris';
import { discordUtil } from '../discord';

export function checkEmbedSize(embed: EmbedOptions | undefined): boolean {
    if (embed === undefined) return true;
    for (const [value = '', limit] of getEmbedValueLimits(embed))
        if (value.length > limit)
            return false;

    return true;
}

function* getEmbedValueLimits(embed: EmbedOptions): IterableIterator<[value: string | unknown[] | undefined, limit: number]> {
    const allValues: unknown[] = [];
    const append = <T>(value: T): T => {
        allValues.push(value);
        return value;
    };

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    yield [append(embed.title), discordUtil.getLimit('embed.title')];
    yield [append(embed.description), discordUtil.getLimit('embed.description')];
    yield [embed.fields, discordUtil.getLimit('embed.fields')];
    for (const field of embed.fields ?? []) {
        yield [append(field.name), discordUtil.getLimit('embed.field.name')];
        yield [append(field.value), discordUtil.getLimit('embed.field.value')];
    }
    yield [append(embed.footer?.text), discordUtil.getLimit('embed.footer.text')];
    yield [append(embed.author?.name), discordUtil.getLimit('embed.author.name')];

    yield [allValues.join(''), discordUtil.getLimit('embed')];

}
