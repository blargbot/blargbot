import { inspect } from 'util';

export function codeBlock(content: unknown, type?: string): string {
    type ??= typeof content === 'string' ? '' : 'json';
    const text = type === 'json' ? inspect(content, { depth: 10 }) : `${content}`;
    return `\`\`\`${type}\n${text}\n\`\`\``;
}

