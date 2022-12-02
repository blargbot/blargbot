import { MessageFilter } from '../MessageFilter.js';
import { GuildCensorExceptions } from './GuildCensorExceptions.js';
import { GuildCensorRule } from './GuildCensorRule.js';

export interface GuildCensors {
    readonly list?: { readonly [censorId: string]: GuildCensor | undefined; };
    readonly exception?: GuildCensorExceptions;
    readonly rule?: GuildCensorRule;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}
