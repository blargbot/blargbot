import type { Configuration } from '@blargbot/config';
import type { ChoiceQueryResult, EntityPickQueryOptions, MalformedEmbed } from '@blargbot/core/types.js';
import type { Database } from '@blargbot/database';
import type { Emote } from '@blargbot/discord-emote';
import type { FlagParser } from '@blargbot/flags';
import type { Logger } from '@blargbot/logger';
import type * as Eris from 'eris';
import type moment from 'moment-timezone';

import type { BBTagContext } from './BBTagContext.js';
import type { BBTagEngine } from './BBTagEngine.js';
import type { Subtag } from './Subtag.js';
import type { AwaitReactionsResponse } from './types.js';
import type { BBTagJsonTools } from './utils/json.js';
import type { BBTagOperators } from './utils/operators.js';
import type { BBTagArrayTools } from './utils/tagArray.js';

export interface InjectionContext {
    readonly discord: Eris.Client;
    readonly logger: Logger;
    readonly database: Database;
    readonly subtags: Iterable<SubtagDescriptor>;
    readonly config: Configuration;
    readonly util: BBTagUtilities;
    readonly parseFlags: FlagParser;
    readonly operators: BBTagOperators;
    readonly arrayTools: BBTagArrayTools;
    readonly jsonTools: BBTagJsonTools;

    readonly converter: BBTagValueConverter;
}

export interface SubtagDescriptor<T extends Subtag = Subtag> {
    createInstance(engine: BBTagEngine): T;
    readonly name: string;
    readonly aliases: string[];
}

export interface BBTagValueConverter {
    int(this: void, value: string, options?: { strict?: boolean; radix?: number; }): number | undefined;
    float(this: void, value: string, options?: { strict?: boolean; }): number | undefined;
    string(this: void, value: JToken | undefined, includeNull?: boolean): string;
    boolean(this: void, value: string | boolean | number | undefined, defValue: boolean, includeNumbers?: boolean): boolean;
    boolean(this: void, value: string | boolean | number | undefined, defValue?: undefined, includeNumbers?: boolean): boolean | undefined;
    duration(this: void, text: string, fallback: moment.Duration): moment.Duration;
    duration(this: void, text: string, fallback?: moment.Duration): moment.Duration | undefined;
    embed(this: void, embedText: undefined, allowMalformed?: true): undefined;
    embed(this: void, embedText: string | undefined, allowMalformed?: true): Array<Eris.EmbedOptions | MalformedEmbed> | undefined;
    embed(this: void, embedText: string | undefined, allowMalformed: false): Eris.EmbedOptions[] | undefined;
    bigInt(this: void, s: string | number | bigint): bigint | undefined;
    color(this: void, text: number | 'random' | string): number | undefined;
    time(this: void, text: 'now' | 'today' | 'tomorrow' | 'yesterday' | string, format?: string, timezone?: string): moment.Moment;
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
