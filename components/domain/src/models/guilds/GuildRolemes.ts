import { GuildTriggerTag } from './GuildTriggerTag';

export interface GuildRolemes {
    readonly [id: string]: GuildRolemeEntry | undefined;
}

export interface GuildRolemeEntry {
    readonly channels: readonly string[];
    readonly casesensitive: boolean;
    readonly message: string;
    readonly add: readonly string[];
    readonly remove: readonly string[];
    readonly output?: GuildTriggerTag;
}
