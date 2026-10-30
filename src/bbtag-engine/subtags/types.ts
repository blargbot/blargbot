import type { BBTagContext } from '../BBTagContext.js';
import type { DiscordPermissions } from '../enums.js';
import type { BBTagInput } from '../types.js';
import type { VariablesProvider } from '../Variables.js';

export interface VariablesFeature {
    readonly variables: VariablesProvider;
}
export interface HttpFetchFeature {
    readonly fetch: typeof globalThis.fetch;
}
export interface GetMemberPermissionsFeature {
    getMemberPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions>;
}
export interface CheckMessageExistsFeature {
    checkMessageExists(channelId: string, messageId: string): Promise<boolean>;
}
type Clear<T> = { [P in keyof T]: T[P] } & {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyObject = {};
export type ApiResult<Success extends null | object = null, Error extends null | object = null> = Clear<
    | { success: true; } & (Success extends null ? EmptyObject : Success)
    | { success: false; reason?: string; } & (Error extends null ? EmptyObject : Error)
>;

export interface QueryEntityRequest {
    readonly guildId: string;
    readonly channelId: string;
    readonly userId: string;
    readonly searchText: string;
    readonly source?: string;
}
export type QueryEntityResponse = ApiResult<{ id: string; }, { cause: 'notFound' | 'aborted'; }>;

export type CompileRegexResult = ApiResult<{ regex: AsyncRegex; }, { cause: 'invalid' | 'unsafe' | 'tooLong'; }>;

export interface CompileRegexFeature {
    compileRegex(pattern: string, flags: string): Promise<CompileRegexResult>;
}

export interface AsyncRegex {
    test(text: string): Promise<boolean>;
    replace(text: string, replaceWith: string): Promise<string>;
    match(text: string): Promise<string[]>;
    split(text: string): Promise<string[]>;

}

export interface CooldownScope {
    readonly guildId: string;
    readonly userId: string;
    readonly tagName: string;
    readonly isCC: boolean;
    readonly cooldownMs: number;
}

export interface TagCooldownFeature {
    assertTagCooldown(scope: CooldownScope): Promise<void>;
}

export interface ParseInputFeature {
    parseInput(context: BBTagContext, input: string | string[]): BBTagInput;
}

export interface EditRoleOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly name?: string;
    readonly permissions?: DiscordPermissions;
    readonly color?: number;
    readonly hoist?: boolean;
    readonly mentionable?: boolean;
    readonly auditReason: string;
}

export interface EditRoleFeature {
    editRole(options: EditRoleOptions): Promise<ApiResult>;
}
