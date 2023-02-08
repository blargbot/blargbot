import { getMessageComponentLimit } from './getMessageComponentLimit.js';

export function checkMessageSize(message: string): boolean {
    return message.length <= getMessageComponentLimit('content');
}
