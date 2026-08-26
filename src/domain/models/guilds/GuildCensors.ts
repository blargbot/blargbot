import type { MessageFilter } from '../MessageFilter.js';
import type { GuildCensorExceptions } from './GuildCensorExceptions.js';
import type { GuildCensorRule } from './GuildCensorRule.js';

export interface GuildCensors {
    readonly list?: { readonly [censorId: string]: GuildCensor | undefined; };
    readonly exception?: GuildCensorExceptions;
    readonly rule?: GuildCensorRule;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}
