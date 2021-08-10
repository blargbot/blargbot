import * as discordUtil from '@core/utils/discord';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

import { hasValue } from './hasValue';

export function checkEmbedSize(embed: ReadonlyArray<MessageEmbedOptions | MessageEmbed> | undefined): boolean {
    if (embed === undefined) return true;
    for (const [value, limit] of getEmbedValueLimits(embed))
        if (hasValue(value) && value.length > limit)
            return false;

    return true;
}

function* getEmbedValueLimits(embeds: ReadonlyArray<MessageEmbedOptions | MessageEmbed>): IterableIterator<[value: { length: number; } | null | undefined, limit: number]> {
    const allValues: string[] = [];
    const append = <T>(value: T): T => {
        if (typeof value === 'string')
            allValues.push(value);
        return value;
    };

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    for (const embed of embeds) {
        yield [append(embed.title), discordUtil.getLimit('embed.title')];
        yield [append(embed.description), discordUtil.getLimit('embed.description')];
        yield [embed.fields, discordUtil.getLimit('embed.fields')];
        for (const field of embed.fields ?? []) {
            yield [append(field.name), discordUtil.getLimit('embed.field.name')];
            yield [append(field.value), discordUtil.getLimit('embed.field.value')];
        }
        yield [append(embed.footer?.text), discordUtil.getLimit('embed.footer.text')];
        yield [append(embed.author?.name), discordUtil.getLimit('embed.author.name')];
    }

    yield [allValues.join(''), discordUtil.getLimit('embeds')];

}
