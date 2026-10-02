import type { BBTagRuntimeThrowable } from '../../BBTagRuntimeError.js';
import type { NsfwLocals, QuietLocals, TemporalValue, VariablesLocals } from '../locals.js';

type QueryEntity<Options extends QueryEntityOptions, Result> =
    & ((searchText: string, options?: Options & { throw: NonNullable<unknown>; }) => Awaitable<Result>)
    & ((searchText: string, options?: Options) => Awaitable<Result | null>)

export interface QueryEntityOptions {
    quiet?: boolean;
    throw?: BBTagRuntimeThrowable<[string]>;
}

export interface QueryUserOptions extends QueryEntityOptions {
    global?: boolean;
}

export interface DiscordLocals<T> {
    readonly discord: T;
}

interface QueryUserMixin {
    readonly queryUser: QueryEntity<QueryUserOptions, bigint>;
}

export interface QueryDiscordUserLocals extends QuietLocals, DiscordLocals<QueryUserMixin> { }

interface QueryRoleMixin {
    readonly queryRole: QueryEntity<QueryEntityOptions, bigint>;
}

export interface QueryDiscordRoleLocals extends QuietLocals, DiscordLocals<QueryRoleMixin> { }

interface BanMixin {
    readonly ban: (options: GuildMemberBanOptions) => Awaitable<boolean>;
    readonly unban: (options: GuildMemberModerationOptions) => Awaitable<boolean>;
}

export type GuildMemberBanLocals = DiscordLocals<BanMixin & QueryUserMixin>;

interface SendDmMixin {
    readonly sendDM: (userId: bigint, message: string | undefined, embeds: SendEmbed[] | undefined) => Awaitable<bigint>;
}

export interface DiscordSendDmLocals extends NsfwLocals, DiscordLocals<SendDmMixin & QueryUserMixin> { }

export interface IsDiscordStaffLocals extends QuietLocals, DiscordLocals<QueryUserMixin> {
    readonly isStaff: (userId: bigint) => Awaitable<boolean>;
}

interface GetBoostTimestampMixin {
    readonly getBoostTimestamp: (userId: bigint) => Awaitable<TemporalValue | null>;
}

export interface GuildMemberBoostingLocals extends QuietLocals, DiscordLocals<QueryUserMixin & GetBoostTimestampMixin> { }

interface KickMixin {
    readonly kick: (options: GuildMemberModerationOptions) => Awaitable<void>;

}

export type GuildMemberKickLocals = DiscordLocals<KickMixin & QueryUserMixin>;

export interface GuildMemberWarningLocals extends QueryDiscordUserLocals {
    readonly warnings: {
        readonly get: (userId: bigint) => Awaitable<number>;
        readonly add: (userId: bigint, count: number, reason: string) => Awaitable<number>;
        readonly remove: (userId: bigint, count: number, reason: string) => Awaitable<number>;
    };
}

interface ListAllMembersMixin {
    readonly listAllMembers: () => Awaitable<AwaitableIterable<bigint>>;
}

export type GuildMemberListLocals = DiscordLocals<ListAllMembersMixin>;

interface TimeoutMixin {
    readonly userTimeout: {
        readonly get: (userId: bigint) => Awaitable<TemporalValue | null>;
        readonly set: (options: GuildTimeoutOptions) => Awaitable<boolean>;
    };
}

export interface GuildMemberTimeoutLocals extends QuietLocals, DiscordLocals<QueryUserMixin & TimeoutMixin> { }

interface ActivityMixin {
    readonly getActivity: (userId: bigint) => Awaitable<GuildMemberActivity | null>;
}

export interface GuildMemberActivityLocals extends QuietLocals, DiscordLocals<ActivityMixin & QueryUserMixin> { }

export interface GuildMemberActivity {
    name: string;
    type: number;
}

interface UserAvatarMixin {
    readonly getAvatarUrl: (options: DiscordUserDetailsOptions) => Awaitable<URL>;
}

export interface DiscordUserAvatarLocals extends QuietLocals, DiscordLocals<UserAvatarMixin & QueryUserMixin> { }

interface UsernameMixin {
    readonly getUsername: (userId: bigint) => Awaitable<string>;
}

export interface DiscordUserNameLocals extends QuietLocals, DiscordLocals<UsernameMixin & QueryUserMixin> { }

interface IsBotMixin {
    readonly isBot: (userId: bigint) => Awaitable<boolean>;
}

export interface DiscordUserIsBotLocals extends QuietLocals, DiscordLocals<IsBotMixin & QueryUserMixin> { }

interface StatusMixin {
    readonly getStatus: (userId: bigint) => Awaitable<string>;
}
export interface DiscordUserStatusLocals extends QuietLocals, DiscordLocals<StatusMixin & QueryUserMixin> { }

export interface DiscordUserTimezoneLocals extends QueryDiscordUserLocals {
    readonly getUserTimezone: (userId: bigint) => Awaitable<string | null>;
}

interface SnowflakeTimestamp {
    readonly getTimestamp: (snowflake: bigint) => TemporalValue;
}

export interface DiscordUserCreatedDateLocals extends QuietLocals, DiscordLocals<SnowflakeTimestamp & QueryUserMixin> { }

interface MentionsMixin {
    readonly mentions: {
        readonly users: Set<bigint>;
        readonly roles: Set<bigint>;
    };
}
export interface DiscordUserMentionLocals extends QuietLocals, DiscordLocals<MentionsMixin & QueryUserMixin> { }
export interface GuildRoleMentionLocals extends QuietLocals, DiscordLocals<MentionsMixin & QueryRoleMixin> { }

interface JoinedTimestampMixin {
    readonly getJoinedTimestamp: (userId: bigint) => Awaitable<TemporalValue>;
}

export interface GuildMemberJoinedDateLocals extends QuietLocals, DiscordLocals<JoinedTimestampMixin & QueryUserMixin> { }

interface ManageableRolesMixin {
    readonly listManageableRoles: () => Awaitable<AwaitableIterable<bigint>>;
}

export type GuildRolesManageableLocals = DiscordLocals<ManageableRolesMixin>;

interface UserRolesMixin {
    readonly listUserRoles: (userId: bigint) => Awaitable<AwaitableIterable<bigint>>;
}

export interface GuildMemberRolesLocals extends QuietLocals, DiscordLocals<UserRolesMixin & QueryUserMixin> { }

interface AllRolesMixin {
    readonly listAllRoles: () => Awaitable<AwaitableIterable<bigint>>;
}

export type GuildAllRolesLocals = DiscordLocals<AllRolesMixin>;

export interface GuildMemberHasRolesLocals extends QuietLocals, DiscordLocals<AllRolesMixin & UserRolesMixin & QueryUserMixin> { }

interface SetUserRolesMixin {
    readonly setUserRoles: (userId: bigint, roleIds: Iterable<bigint>) => Awaitable<boolean>;
}

export interface GuildMemberSetRolesLocals extends QuietLocals, VariablesLocals, DiscordLocals<SetUserRolesMixin & QueryRoleMixin & QueryUserMixin & ManageableRolesMixin> { }
export interface GuildMemberAddRolesLocals extends QuietLocals, DiscordLocals<SetUserRolesMixin & UserRolesMixin & AllRolesMixin & QueryUserMixin & ManageableRolesMixin> { }
export interface GuildMemberRemoveRolesLocals extends QuietLocals, DiscordLocals<SetUserRolesMixin & UserRolesMixin & AllRolesMixin & QueryUserMixin & ManageableRolesMixin> { }

interface RoleColorMixin {
    readonly getRoleColor: (roleId: bigint) => Awaitable<number>;
}

export interface GuildRoleColorLocals extends QuietLocals, DiscordLocals<RoleColorMixin & QueryRoleMixin> { }

interface CreateRoleOptions {
    name: string;
    color: number | null;
    permissions: bigint;
    mentionable: boolean;
    hoist: boolean;
}

interface CreateRoleMixin {
    readonly createRole: (options: CreateRoleOptions) => Awaitable<bigint | null>;
}

export interface GuildRoleCreateLocals extends QuietLocals, DiscordLocals<CreateRoleMixin & ManageableRolesMixin> { }

interface DeleteRoleMixin {
    readonly deleteRole: (roleId: bigint) => Awaitable<boolean>;
}

export interface GuildRoleDeleteLocals extends QuietLocals, DiscordLocals<DeleteRoleMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface SetRoleColorMixin {
    readonly setRoleColor: (roleId: bigint, color: number | null) => Awaitable<boolean>;
}

export interface GuildRoleSetColorLocals extends QuietLocals, DiscordLocals<SetRoleColorMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface SetRoleMentionableMixin {
    readonly setRoleMentionable: (roleId: bigint, mentionable: boolean) => Awaitable<boolean>;
}

export interface GuildRoleSetMentionableLocals extends QuietLocals, DiscordLocals<SetRoleMentionableMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface SetRoleNameMixin {
    readonly setRoleName: (roleId: bigint, name: string) => Awaitable<boolean>;
}

export interface GuildRoleSetNameLocals extends QuietLocals, DiscordLocals<SetRoleNameMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface SetRolePermissionsMixin {
    readonly setRolePermissions: (roleId: bigint, permissions: bigint) => Awaitable<boolean>;
}

export interface GuildRoleSetPermissionsLocals extends QuietLocals, DiscordLocals<SetRolePermissionsMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface SetRolePositionMixin {
    readonly setRolePosition: (roleId: bigint, position: number) => Awaitable<boolean>;
}

export interface GuildRoleSetPositionLocals extends QuietLocals, DiscordLocals<SetRolePositionMixin & RolePositionMixin & QueryRoleMixin & ManageableRolesMixin> { }

interface RoleMembersMixin {
    readonly listRoleMembers: (roleId: bigint) => Awaitable<AwaitableIterable<bigint>>;
}

export interface GuildRoleMembersLocals extends QuietLocals, DiscordLocals<RoleMembersMixin & QueryRoleMixin> { }

interface RoleSizeMixin {
    readonly getRoleMemberCount: (roleId: bigint) => Awaitable<number>;
}

export interface GuildRoleSizeLocals extends QuietLocals, DiscordLocals<RoleSizeMixin & QueryRoleMixin> { }

interface RoleNameMixin {
    readonly getRoleName: (roleId: bigint) => Awaitable<string>;
}

export interface GuildRoleNameLocals extends QuietLocals, DiscordLocals<RoleNameMixin & QueryRoleMixin> { }

interface RolePermissionsMixin {
    readonly getRolePermissions: (roleId: bigint) => Awaitable<bigint>;
}

export interface GuildRolePermissionsLocals extends QuietLocals, DiscordLocals<RolePermissionsMixin & QueryRoleMixin> { }

interface RolePositionMixin {
    readonly getRolePosition: (roleId: bigint) => Awaitable<number>;
}

export interface GuildRolePositionLocals extends QuietLocals, DiscordLocals<RolePositionMixin & QueryRoleMixin> { }
export interface GuildRolesLocals extends QuietLocals, DiscordLocals<AllRolesMixin & UserRolesMixin & QueryUserMixin> { }

interface NicknameMixin {
    readonly getNickname: (options: DiscordUserDetailsOptions) => Awaitable<string>;
}

export interface DiscordUserNicknameLocals extends QuietLocals, DiscordLocals<NicknameMixin & QueryUserMixin> { }

interface SetNicknameMixin {
    readonly setNickname: (userId: bigint, nickname: string) => Awaitable<boolean>;
}

export interface GuildMemberSetNicknameLocals extends QuietLocals, DiscordLocals<SetNicknameMixin & QueryUserMixin> { }

export interface DiscordUserDetailsOptions {
    userId: bigint;
    globalOnly: boolean;
}

export interface GuildMemberModerationOptions {
    userId: bigint;
    authorizer: 'tag' | 'user';
    reason: string;
}

export interface GuildTimeoutOptions extends GuildMemberModerationOptions {
    duration: number;
}

export interface GuildMemberBanOptions extends GuildMemberModerationOptions {
    daysToDelete: number;
    duration: number | null;
}

export interface SendEmbed {
    author?: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        icon_url?: string;
        name: string;
        url?: string;
    };
    color?: number;
    description?: string;
    fields?: Array<{
        inline?: boolean;
        name: string;
        value: string;
    }>;
    footer?: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        icon_url?: string;
        text: string;
    };
    image?: {
        url?: string;
    };
    thumbnail?: {
        url?: string;
    };
    timestamp?: Temporal.Instant;
    title?: string;
    url?: string;
}
