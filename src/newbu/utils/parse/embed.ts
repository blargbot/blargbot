import { Embed, EmbedField } from 'eris';

export type MalformedEmbed = { fields: [EmbedField], malformed: true };

export function embed(embedText: string): Embed | MalformedEmbed | undefined | null {
    if (embedText == null)
        return undefined;

    if (!embedText || !embedText.trim())
        return undefined;

    try {
        const parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || Array.isArray(parsed))
            return null;
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