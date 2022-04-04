import { MessageFilter } from '../MessageFilter';
import { GuildCensorExceptions } from './GuildCensorExceptions';
import { GuildCensorRule } from './GuildCensorRule';

export interface GuildCensors {
    readonly list?: { readonly [censorId: string]: GuildCensor | undefined; };
    readonly exception?: GuildCensorExceptions;
    readonly rule?: GuildCensorRule;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}
