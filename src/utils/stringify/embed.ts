import { EmbedOptions } from 'eris';
import moment from 'moment';


export function embed(embed: EmbedOptions & { asString?: string; }): string {
    if ('asString' in embed && embed.asString !== undefined)
        return embed.asString;

    const result = [];
    if (embed.author !== undefined)
        result.push(`__**${embed.author.name}**__`);
    if (embed.title !== undefined)
        result.push(embed.title);
    if (embed.description !== undefined)
        result.push(embed.description);
    for (const field of embed.fields ?? []) {
        if (field.name.replace('\u200b', '').trim().length > 0)
            result.push(`__**- ${field.name}**__`);
        if (field.value.replace('\u200b', '').trim().length > 0)
            result.push(field.value);
    }
    const footer = [];
    if (embed.footer !== undefined)
        footer.push(embed.footer.text);
    if (embed.timestamp !== undefined)
        footer.push(moment(embed.timestamp).format('dddd, MMMM, Do YYYY, h:mm:ss a zz'));
    if (footer.length > 0)
        result.push(footer.join('|'));
    if (embed.image?.url !== undefined)
        result.push(embed.image.url);
    return result.join('\n');
}
