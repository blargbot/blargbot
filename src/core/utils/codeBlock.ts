import { inspect } from 'util';

export function codeBlock(content: unknown, type?: string): string {
    const str = typeof content === `string` ? content : inspect(content, { depth: 10 });
    type ??= typeof content === `string` ? `` : `json`;
    const text = type === `json` ? inspect(content, { depth: 10 }) : `${str}`;
    return `\`\`\`${type}\n${text}\n\`\`\``;
}
