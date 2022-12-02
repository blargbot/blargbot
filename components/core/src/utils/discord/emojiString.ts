import { Emote } from '@blargbot/core/Emote.js';
import Eris from 'eris';

export function emojiString(emoji: Eris.PartialEmoji | Emote): string {
    return emoji.id === null || emoji.id === undefined ? emoji.name
        : emoji.animated === true ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;
}
