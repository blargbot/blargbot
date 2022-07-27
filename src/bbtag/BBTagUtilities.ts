import { Configuration } from '@blargbot/config';
import { BaseUtilities } from '@blargbot/core/BaseUtilities';
import { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types';
import { Database } from '@blargbot/database';
import { Logger } from '@blargbot/logger';
import { Client as Discord, Guild, KnownChannel, KnownMessage, Member, Role, User } from 'eris';
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

export interface BBTagUtilities extends BaseUtilities {
    isUserStaff(member: Member): Promise<boolean>;

    queryMember(options: EntityPickQueryOptions<Member>): Promise<ChoiceQueryResult<Member>>;
    queryRole(options: EntityPickQueryOptions<Role>): Promise<ChoiceQueryResult<Role>>;
    queryChannel<T extends KnownChannel>(options: EntityPickQueryOptions<T>): Promise<ChoiceQueryResult<T>>;

    warn(member: Member, moderator: User, count: number, reason?: string): Promise<number>;
    pardon(member: Member, moderator: User, count: number, reason?: string): Promise<number>;
    ban(guild: Guild, user: User, moderator: User, authorizer: User, deleteDays: number, reason: string, duration: Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: Guild, user: User, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    timeout(member: Member, moderator: User, authorizer: User, duration: Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: Member, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: Member, moderator: User, authorizer: User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    addModlog(guild: Guild, action: string, user: User, moderator?: User, reason?: string, color?: number): Promise<void>;

    awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(channels: string[], filter: (message: KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<KnownMessage | undefined>;

    setTimeout(context: BBTagContext, content: string, timeout: Duration): Promise<void>;

    canRequestDomain(domain: string): boolean;
}
