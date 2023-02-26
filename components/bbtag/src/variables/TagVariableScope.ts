import type { TagVariableType } from './TagVariableType.js';

export type TagVariableScope =
    | GuildCCVariableScope
    | GuildTagVariableScope
    | AuthorVariableScope
    | GlobalVariableScope
    | TemporaryVariableScope
    | LocalCCVariableScope
    | LocalTagVariableScope

export type TagVariableScopeFilter = {
    [T in TagVariableScope as T['type']]: ToTagVariableScopeFilter<T>;
}[TagVariableScope['type']]

type ToTagVariableScopeFilter<T extends TagVariableScope> =
    & { readonly type: T['type']; }
    & { [P in Exclude<keyof T, 'type'>]?: T[P] | ReadonlyArray<T[P]> }

export interface GuildCCVariableScope {
    readonly type: TagVariableType.GUILD_CC;
    readonly guildId: string;
}

export interface GuildTagVariableScope {
    readonly type: TagVariableType.GUILD_TAG;
    readonly guildId: string;
}

export interface AuthorVariableScope {
    readonly type: TagVariableType.AUTHOR;
    readonly authorId: string;
}

export interface GlobalVariableScope {
    readonly type: TagVariableType.GLOBAL;
}

export interface TemporaryVariableScope {
    readonly type: TagVariableType.TEMP;
}

export interface LocalTagVariableScope {
    readonly type: TagVariableType.LOCAL_TAG;
    readonly name: string;
}

export interface LocalCCVariableScope {
    readonly type: TagVariableType.LOCAL_CC;
    readonly guildId: string;
    readonly name: string;
}
