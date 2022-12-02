import { Configuration } from '@blargbot/config';
import { Emote } from '@blargbot/core/Emote.js';
import { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types.js';
import { Database } from '@blargbot/database';
import { Logger } from '@blargbot/logger';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from './BBTagContext.js';
import { Subtag } from './Subtag.js';
import { AwaitReactionsResponse } from './types.js';

export interface InjectionContext {
    readonly discord: Eris.Client;
    readonly logger: Logger;
    readonly database: Database;
    readonly subtags: Iterable<Subtag>;
    readonly config: Configuration;
    readonly util: BBTagUtilities;
}

export interface BBTagSendContent extends Omit<Eris.AdvancedMessageContent, 'embed' | 'messageReferenceID'> {
    file?: Eris.FileContent[];
    nsfw?: string;
}

export interface BBTagUtilities {
    defaultPrefix: string;

    isUserStaff(member: Eris.Member): Promise<boolean>;

    send<T extends Eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: Eris.User): Promise<Eris.Message<T> | undefined>;

    getChannel(channelId: string): Promise<Eris.KnownChannel | undefined>;
    getChannel(guild: string | Eris.Guild, channelId: string): Promise<Eris.KnownGuildChannel | undefined>;
    findChannels(guild: string | Eris.Guild, query?: string): Promise<Eris.KnownGuildChannel[]>;
    queryChannel<T extends Eris.KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>;

    ensureMemberCache(guild: Eris.Guild): Promise<void>;
    getMember(guild: string | Eris.Guild, userId: string): Promise<Eris.Member | undefined>;
    findMembers(guild: string | Eris.Guild, query?: string): Promise<Eris.Member[]>;
    queryMember(options: EntityPickQueryOptions<string, Eris.Member>): Promise<ChoiceQueryResult<Eris.Member>>;

    getUser(userId: string): Promise<Eris.User | undefined>;
    getBannedUsers(guild: Eris.Guild): Promise<string[]>;

    getRole(guild: string | Eris.Guild, roleId: string): Promise<Eris.Role | undefined>;
    findRoles(guild: string | Eris.Guild, query?: string): Promise<Eris.Role[]>;
    queryRole(options: EntityPickQueryOptions<string, Eris.Role>): Promise<ChoiceQueryResult<Eris.Role>>;

    getMessage(channel: string, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined>;
    getMessage(channel: Eris.KnownChannel, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined>;

    warn(member: Eris.Member, moderator: Eris.User, count: number, reason?: string): Promise<number>;
    pardon(member: Eris.Member, moderator: Eris.User, count: number, reason?: string): Promise<number>;
    ban(guild: Eris.Guild, user: Eris.User, moderator: Eris.User, authorizer: Eris.User, deleteDays: number, reason: string, duration: moment.Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: Eris.Guild, user: Eris.User, moderator: Eris.User, authorizer: Eris.User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    timeout(member: Eris.Member, moderator: Eris.User, authorizer: Eris.User, duration: moment.Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: Eris.Member, moderator: Eris.User, authorizer: Eris.User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: Eris.Member, moderator: Eris.User, authorizer: Eris.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    addModLog(guild: Eris.Guild, action: string, user: Eris.User, moderator?: Eris.User, reason?: string, color?: number): Promise<void>;

    addReactions(context: Eris.Message, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }>;
    awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(channels: string[], filter: (message: Eris.KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<Eris.KnownMessage | undefined>;

    setTimeout(context: BBTagContext, content: string, timeout: moment.Duration): Promise<void>;

    canRequestDomain(domain: string): boolean;
    generateDumpPage(payload: Eris.AdvancedMessageContent, channel: Eris.KnownChannel): Promise<string>;
    websiteLink(path?: string): string;
}
