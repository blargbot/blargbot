import { EmbedOptions } from 'eris';

export function parseEmbed (embedText?: string): (EmbedOptions & { malformed?: true;}) | undefined {
    if (embedText == null)
        return undefined;

    if (!embedText || !embedText.trim())
        return undefined;

    try {
        const parsed = JSON.parse(embedText);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
        else return parsed;
    } catch (e) {
        return { fields: [{ name: 'Malformed JSON', value: embedText + '' }], malformed: true };
    }
}