import { Configuration } from '@blargbot/config';
import { Emote } from '@blargbot/core/Emote';
import { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types';
import { Database } from '@blargbot/database';
import { Logger } from '@blargbot/logger';
import { AdvancedMessageContent, Client as Discord, FileContent, Guild, KnownChannel, KnownGuildChannel, KnownMessage, Member, Message, Role, TextableChannel, User } from 'eris';
import { Duration } from 'moment-timezone';

import { BBTagContext } from './BBTagContext';
import { Subtag } from './Subtag';
import { AwaitReactionsResponse } from './types';

export interface InjectionContext {
    readonly discord: Discord;
    readonly logger: Logger;
    readonly database: Database;
    readonly subtags: Iterable<Subtag>;
    readonly config: Configuration;
    readonly util: BBTagUtilities;
}

export interface BBTagSendContent extends Omit<AdvancedMessageContent, 'embed' | 'messageReferenceID'> {
    file?: FileContent[];
    nsfw?: string;
}

export interface BBTagUtilities {
    defaultPrefix: string;

    isUserStaff(member: Member): Promise<boolean>;

    send<T extends TextableChannel>(channel: T, payload: BBTagSendContent, author?: User): Promise<Message<T> | undefined>;

    getChannel(channelId: string): Promise<KnownChannel | undefined>;
    getChannel(guild: string | Guild, channelId: string): Promise<KnownGuildChannel | undefined>;
    findChannels(guild: string | Guild, query?: string): Promise<KnownGuildChannel[]>;
    queryChannel<T extends KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>;

    ensureMemberCache(guild: Guild): Promise<void>;
    getMember(guild: string | Guild, userId: string): Promise<Member | undefined>;
    findMembers(guild: string | Guild, query?: string): Promise<Member[]>;
    queryMember(options: EntityPickQueryOptions<string, Member>): Promise<ChoiceQueryResult<Member>>;

    getUser(userId: string): Promise<User | undefined>;
    getBannedUsers(guild: Guild): Promise<string[]>;

    getRole(guild: string | Guild, roleId: string): Promise<Role | undefined>;
    findRoles(guild: string | Guild, query?: string): Promise<Role[]>;
    queryRole(options: EntityPickQueryOptions<string, Role>): Promise<ChoiceQueryResult<Role>>;

    getMessage(channel: string, messageId: string, force?: boolean): Promise<KnownMessage | undefined>;
    getMessage(channel: KnownChannel, messageId: string, force?: boolean): Promise<KnownMessage | undefined>;

    warn(member: Member, moderator: User, count: number, reason?: string): Promise<number>;
    pardon(member: Member, moderator: User, count: number, reason?: string): Promise<number>;
    ban(guild: Guild, user: User, moderator: User, authorizer: User, deleteDays: number, reason: string, duration: Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: Guild, user: User, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    timeout(member: Member, moderator: User, authorizer: User, duration: Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: Member, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: Member, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    addModLog(guild: Guild, action: string, user: User, moderator?: User, reason?: string, color?: number): Promise<void>;

    addReactions(context: Message, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }>;
    awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(channels: string[], filter: (message: KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<KnownMessage | undefined>;

    setTimeout(context: BBTagContext, content: string, timeout: Duration): Promise<void>;

    canRequestDomain(domain: string): boolean;
    generateDumpPage(payload: AdvancedMessageContent, channel: KnownChannel): Promise<string>;
    websiteLink(path?: string): string;
}
