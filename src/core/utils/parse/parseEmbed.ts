import { guard } from '@cluster/utils';
import { MalformedEmbed } from '@core/types';
import { MessageEmbedOptions } from 'discord.js';

export function parseEmbed(embedText: string): MessageEmbedOptions[] | MalformedEmbed[] | undefined {
    if (embedText.trim().length === 0)
        return undefined;

    try {
        let parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || parsed === null)
            return undefined;
        if (!Array.isArray(parsed) && guard.hasValue(parsed.v)) {
            if (typeof parsed.v !== 'object')
                return undefined;
            parsed = parsed.v;
        }
        if (!Array.isArray(parsed))
            return [parsed];

        const embeds: MessageEmbedOptions[] = [];
        for (const value of parsed) {
            let parsedValue;
            if (typeof value === 'string') {
                parsedValue = singleEmbed(value);
                if (parsedValue === undefined)
                    return undefined;
                if (parsedValue.malformed === true)
                    return [parsedValue];
            } else {
                parsedValue = value;
            }
            embeds.push(<MessageEmbedOptions>parsedValue);
        }
        return embeds;
    } catch (e: unknown) {
        return [{
            fields: [
                {
                    name: 'Malformed JSON',
                    value: embedText + ''
                }
            ],
            malformed: true
        }];
    }
}

function singleEmbed(embedText: string): (MessageEmbedOptions & { malformed?: false; }) | MalformedEmbed | undefined {
    if (embedText.trim().length === 0)
        return undefined;
    try {
        const parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return undefined;
        return {
            ...parsed,
            malformed: false
        };
    } catch (e: unknown) {
        return {
            fields: [
                {
                    name: 'Malformed JSON',
                    value: embedText + ''
                }
            ],
            malformed: true
        };
    }
}
