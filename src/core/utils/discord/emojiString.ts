import { PartialEmoji } from 'eris';

export function emojiString(emoji: PartialEmoji): string {
    return emoji.id === null ? emoji.name
        : emoji.animated === true ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;
}
