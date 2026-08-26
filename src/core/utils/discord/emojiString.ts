import type { Emote } from '@blargbot/core/Emote.js';
import type * as eris from 'eris';

export function emojiString(emoji: eris.PartialEmoji | Emote): string {
    return emoji.id === null || emoji.id === undefined ? emoji.name
        : emoji.animated === true ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;
}
