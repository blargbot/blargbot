import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import type { Database } from '@blargbot/database';
import type { Logger } from '@blargbot/logger';
import type { sleep } from '@blargbot/util';
import type * as eris from 'eris';
import type moment from 'moment-timezone';

import type { Subtag } from './Subtag.js';

export interface InjectionContext {
    readonly discord: eris.Client;
    readonly logger: Logger;
    readonly database: Database;
    readonly subtags: Iterable<Subtag>;
    readonly util: BBTagUtilities;
    readonly sleep: typeof sleep;
}

export interface BBTagSendContent extends Omit<eris.AdvancedMessageContent, 'embed' | 'messageReferenceID'> {
    file?: eris.FileContent[];
    nsfw?: string;
}

export interface BBTagUtilities {
    send<T extends eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: eris.User): Promise<eris.Message<T> | undefined>;

    getChannel(channelId: string): Promise<eris.KnownChannel | undefined>;
    getChannel(guild: string | eris.Guild, channelId: string): Promise<eris.KnownGuildChannel | undefined>;
    findChannels(guild: string | eris.Guild, query?: string): Promise<eris.KnownGuildChannel[]>;
    queryChannel<T extends eris.KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>;

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

    timeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, duration: moment.Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
}
