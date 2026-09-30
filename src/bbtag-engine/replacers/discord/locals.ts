import type { NsfwLocals, TemporalValue } from '../locals.js';

export interface QueryEntityOptions {
    noLookup?: boolean;
    noErrors?: boolean;
    throw?: boolean | string;
}

export interface QueryUserOptions extends QueryEntityOptions {
    global?: boolean;
}

export interface DiscordUserLocals {
    userId: bigint;
    queryUser: {
        (searchText: string, options: QueryUserOptions & { throw: true | string; }): Awaitable<bigint>;
        (searchText: string, options?: QueryUserOptions): Awaitable<bigint | null>;
    };
}
export interface DiscordMentionsLocals {
    mentions: {
        users: Set<bigint>;
        roles: Set<bigint>;
    };
}

export interface GuildMemberBanLocals extends DiscordUserLocals {
    banGuildMember: (options: GuildMemberBanOptions) => Awaitable<boolean>;
    unbanGuildMember: (options: GuildMemberModerationOptions) => Awaitable<boolean>;
}

export interface DmUserLocals extends DiscordUserLocals, NsfwLocals {
    createDM: (userId: bigint, message: string | undefined, embeds: SendEmbed[] | undefined) => Awaitable<bigint>;
}

export interface IsDiscordStaffLocals extends DiscordUserLocals {
    isUserStaff: (userId: bigint) => Awaitable<boolean>;
}

export interface GuildMemberLocals {
    getGuildMember: (userId: bigint) => Awaitable<JObject>;
}

export interface GuildMemberBoostingLocals extends DiscordUserLocals {
    getGuildMemberBoostSince: (userId: bigint) => Awaitable<TemporalValue | null>;
}

export interface GuildMemberKickLocals extends DiscordUserLocals {
    kickGuildMember: (options: GuildMemberModerationOptions) => Awaitable<void>;
}

export interface GuildMemberWarningLocals extends DiscordUserLocals {
    warnGuildMember: (userId: bigint, count: number, reason: string) => Awaitable<number>;
    pardonGuildMember: (userId: bigint, count: number, reason: string) => Awaitable<number>;
    getGuildMemberWarnings: (userId: bigint) => Awaitable<number>;
}

export interface GuildMemberListLocals {
    getAllGuildMembers: () => Awaitable<AwaitableIterable<bigint>>;
}

export interface GuildMemberTimeoutLocals extends DiscordUserLocals {
    timeoutGuildMember: (options: GuildTimeoutOptions) => Awaitable<boolean>;
}

export interface GuildMemberActivityLocals extends DiscordUserLocals {
    getGuildMemberActivity: (userId: bigint) => Awaitable<GuildMemberActivity | null>;
}

export interface GuildMemberActivity {
    name: string;
    type: number;
}

export interface DiscordUserAvatarLocals extends DiscordUserLocals {
    getUserAvatar: (options: DiscordUserDetailsOptions) => Awaitable<URL>;
}

export interface DiscordUserNameLocals extends DiscordUserLocals {
    getUserName: (userId: bigint) => Awaitable<string>;
}

export interface DiscordUserIsBotLocals extends DiscordUserLocals {
    getIsUserBot: (userId: bigint) => Awaitable<boolean>;
}

export interface DiscordUserStatusLocals extends DiscordUserLocals {
    getUserStatus: (userId: bigint) => Awaitable<string>;
}

export interface DiscordUserTimezoneLocals extends DiscordUserLocals {
    getUserTimezone: (userId: bigint) => Awaitable<string | null>;
}

export interface GuildMemberTimeoutLocals extends DiscordUserLocals {
    getGuildMemberTimeout: (userId: bigint) => Awaitable<TemporalValue | null>;
}

export interface DiscordUserCreatedDateLocals extends DiscordUserLocals {
    getUserCreatedDate: (userId: bigint) => Awaitable<TemporalValue>;
}

export interface GuildMemberJoinedDateLocals extends DiscordUserLocals {
    getGuildMemberJoinedDate: (userId: bigint) => Awaitable<TemporalValue>;
}

export interface GuildMemberRolesLocals extends DiscordUserLocals {
    getGuildMemberRoles: (userId: bigint) => Awaitable<AwaitableIterable<bigint>>;
    setGuildMemberRoles: (userId: bigint, roleIds: Iterable<bigint>) => Awaitable<boolean>;
}

export interface GuildRolesLocals {
    getAllRoles: () => Awaitable<AwaitableIterable<bigint>>;
    getAssignableRoles: () => Awaitable<AwaitableIterable<bigint>>;
    queryRole: {
        (searchText: string, options: QueryEntityOptions & { throw: true | string; }): Awaitable<bigint>;
        (searchText: string, options?: QueryEntityOptions): Awaitable<bigint | null>;
    };
}

export interface DiscordUserNicknameLocals extends DiscordUserLocals {
    getNickname: (options: DiscordUserDetailsOptions) => Awaitable<string>;
    setGuildMemberNickname: (userId: bigint, nickname: string) => Awaitable<void>;
}

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
    duration?: number;
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
