import { guard } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';
import moment from 'moment-timezone';

export function embed(embeds: ReadonlyArray<(Eris.EmbedOptions | Eris.Embed) & { asString?: string; }>): string {
    return [...embedsIter(embeds)].join('\n').trim();
}

function* embedsIter(embeds: ReadonlyArray<(Eris.EmbedOptions | Eris.Embed) & { asString?: string; }>): Generator<string> {
    for (const embed of embeds) {
        if ('asString' in embed && embed.asString !== undefined) {
            yield embed.asString;
            continue;
        }

        if (guard.hasValue(embed.author))
            yield `__**${embed.author.name}**__`;
        if (guard.hasValue(embed.title))
            yield embed.title;
        if (guard.hasValue(embed.description))
            yield embed.description;
        for (const field of embed.fields ?? []) {
            if (field.name.replace('\u200b', '').trim().length > 0)
                yield `__**- ${field.name}**__`;
            if (field.value.replace('\u200b', '').trim().length > 0)
                yield field.value;
        }
        const footer = [];
        if (guard.hasValue(embed.footer))
            footer.push(embed.footer.text);
        if (embed.timestamp !== undefined)
            footer.push(moment(embed.timestamp).format('dddd, MMMM, Do YYYY, h:mm:ss a zz'));
        if (footer.length > 0)
            yield footer.join('|');
        if (embed.image?.url !== undefined)
            yield embed.image.url;

        yield '\n\n';
    }
}
