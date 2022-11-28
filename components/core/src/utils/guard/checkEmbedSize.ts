import { discord } from '@blargbot/core/utils/discord';
import Eris from 'eris';

import { hasValue } from './hasValue';

export function checkEmbedSize(embed: ReadonlyArray<Eris.EmbedOptions | Eris.Embed> | undefined): boolean {
    if (embed === undefined) return true;
    for (const [value, limit] of getEmbedValueLimits(embed))
        if (hasValue(value) && value.length > limit)
            return false;

    return true;
}

function* getEmbedValueLimits(embeds: ReadonlyArray<Eris.EmbedOptions | Eris.Embed>): IterableIterator<[value: { length: number; } | null | undefined, limit: number]> {
    const allValues: string[] = [];
    const append = <T>(value: T): T => {
        if (typeof value === 'string')
            allValues.push(value);
        return value;
    };

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    for (const embed of embeds) {
        yield [append(embed.title), discord.getLimit('embed.title')];
        yield [append(embed.description), discord.getLimit('embed.description')];
        yield [embed.fields, discord.getLimit('embed.fields')];
        for (const field of embed.fields ?? []) {
            yield [append(field.name), discord.getLimit('embed.field.name')];
            yield [append(field.value), discord.getLimit('embed.field.value')];
        }
        yield [append(embed.footer?.text), discord.getLimit('embed.footer.text')];
        yield [append(embed.author?.name), discord.getLimit('embed.author.name')];
    }

    yield [allValues.join(''), discord.getLimit('embeds')];

}
