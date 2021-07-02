import { EmbedOptions } from 'eris';
import { MalformedEmbed } from '../../types';

export function embed(embedText: string): EmbedOptions | MalformedEmbed | undefined {
    if (embedText == null)
        return undefined;

    if (!embedText || !embedText.trim())
        return undefined;

    try {
        const parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return undefined;
        else
            return parsed;
    } catch (e) {
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