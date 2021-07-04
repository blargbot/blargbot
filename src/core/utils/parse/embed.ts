import { EmbedOptions } from 'eris';
import { MalformedEmbed } from '../../types';

export function embed(embedText: string): EmbedOptions | MalformedEmbed | undefined {
    if (embedText.trim().length === 0)
        return undefined;

    try {
        const parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return undefined;
        return parsed;
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
