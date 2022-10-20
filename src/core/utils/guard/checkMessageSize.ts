import { discord } from '../discord';

export function checkMessageSize(message: string): boolean {
    return message.length <= discord.getLimit('content');
}
