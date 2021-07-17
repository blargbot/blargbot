import * as discordUtil from '../discord';

export function checkMessageSize(message: string): boolean {
    return message.length <= discordUtil.getLimit('content');
}
