import { discord } from '../discord/index.js';

export function checkMessageSize(message: string): boolean {
    return message.length <= discord.getLimit('content');
}
