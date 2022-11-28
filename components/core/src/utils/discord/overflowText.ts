import { getLimit, MessageStringComponent } from './getLimit';

export function overflowText(component: MessageStringComponent, content: string, overflow: string, limitMod: (limit: number) => number = l => l): string {
    const limitRaw = getLimit(component);
    const limit = Math.max(0, Math.min(limitRaw, limitMod(limitRaw)));
    if (content.length <= limit)
        return content;

    return content.slice(0, limit - overflow.length) + overflow;
}
