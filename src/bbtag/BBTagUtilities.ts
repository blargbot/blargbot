import type { Configuration } from '@blargbot/config';
import type { Emote } from '@blargbot/core/Emote.js';
import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types.js';
import type { Database } from '@blargbot/database';
import type { Logger } from '@blargbot/logger';
import type * as eris from 'eris';
import type moment from 'moment-timezone';
import type fetch from 'node-fetch';

import type { BBTagContext } from './BBTagContext.js';
import type { Subtag } from './Subtag.js';
import type { AwaitReactionsResponse } from './types.js';

export interface InjectionContext {
    readonly discord: eris.Client;
    readonly logger: Logger;
    readonly database: Database;
    readonly subtags: Iterable<Subtag>;
    readonly config: Configuration;
    readonly util: BBTagUtilities;
    readonly fetch: typeof fetch;
}

export interface BBTagSendContent extends Omit<eris.AdvancedMessageContent, 'embed' | 'messageReferenceID'> {
    file?: eris.FileContent[];
    nsfw?: string;
}

export interface BBTagUtilities {
    defaultPrefix: string;

    isUserStaff(member: eris.Member): Promise<boolean>;

    send<T extends eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: eris.User): Promise<eris.Message<T> | undefined>;

    getChannel(channelId: string): Promise<eris.KnownChannel | undefined>;
    getChannel(guild: string | eris.Guild, channelId: string): Promise<eris.KnownGuildChannel | undefined>;
    findChannels(guild: string | eris.Guild, query?: string): Promise<eris.KnownGuildChannel[]>;
    queryChannel<T extends eris.KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>;

    ensureMemberCache(guild: eris.Guild): Promise<void>;
    getMember(guild: string | eris.Guild, userId: string): Promise<eris.Member | undefined>;
    findMembers(guild: string | eris.Guild, query?: string): Promise<eris.Member[]>;
    queryMember(options: EntityPickQueryOptions<string, eris.Member>): Promise<ChoiceQueryResult<eris.Member>>;

    getUser(userId: string): Promise<eris.User | undefined>;
    getBannedUsers(guild: eris.Guild): Promise<string[]>;

    getRole(guild: string | eris.Guild, roleId: string): Promise<eris.Role | undefined>;
    findRoles(guild: string | eris.Guild, query?: string): Promise<eris.Role[]>;
    queryRole(options: EntityPickQueryOptions<string, eris.Role>): Promise<ChoiceQueryResult<eris.Role>>;

    getMessage(channel: string, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>;
    getMessage(channel: eris.KnownChannel, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>;

    warn(member: eris.Member, moderator: eris.User, count: number, reason?: string): Promise<number>;
    pardon(member: eris.Member, moderator: eris.User, count: number, reason?: string): Promise<number>;
    ban(guild: eris.Guild, user: eris.User, moderator: eris.User, authorizer: eris.User, deleteDays: number, reason: string, duration: moment.Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: eris.Guild, user: eris.User, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    timeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, duration: moment.Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    addModLog(guild: eris.Guild, action: string, user: eris.User, moderator?: eris.User, reason?: string, color?: number): Promise<void>;

    addReactions(context: eris.Message, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }>;
    awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(channels: string[], filter: (message: eris.KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<eris.KnownMessage | undefined>;

    setTimeout(context: BBTagContext, content: string, timeout: moment.Duration): Promise<void>;

    canRequestDomain(domain: string): boolean;
    generateDumpPage(payload: eris.AdvancedMessageContent, channel: eris.KnownChannel): Promise<string>;
    websiteLink(path?: string): string;
}
