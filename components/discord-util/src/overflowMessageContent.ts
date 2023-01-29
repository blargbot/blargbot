import type { MessageStringComponent } from './getMessageComponentLimit.js';
import { getMessageComponentLimit } from './getMessageComponentLimit.js';

export function overflowMessageContent(component: MessageStringComponent, content: string, overflow: string, limitMod: (limit: number) => number = l => l): string {
    const limitRaw = getMessageComponentLimit(component);
    const limit = Math.max(0, Math.min(limitRaw, limitMod(limitRaw)));
    if (content.length <= limit)
        return content;

    return content.slice(0, limit - overflow.length) + overflow;
}
