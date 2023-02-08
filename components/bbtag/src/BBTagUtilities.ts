import type { Configuration } from '@blargbot/config';
import type { Database } from '@blargbot/database';
import type { FlagParser } from '@blargbot/flags';
import type { Logger } from '@blargbot/logger';
import type moment from 'moment-timezone';

import type { BBTagContext } from './BBTagContext.js';
import type { BBTagEngine } from './BBTagEngine.js';
import type { EmbedParser } from './index.js';
import type { ChannelService } from './services/ChannelService.js';
import type { GuildService } from './services/GuildService.js';
import type { MessageService } from './services/MessageService.js';
import type { RoleService } from './services/RoleService.js';
import type { UserService } from './services/UserService.js';
import type { Subtag } from './Subtag.js';
import type { Entities } from './types.js';
import type { BBTagJsonTools } from './utils/json.js';
import type { BBTagOperators } from './utils/operators.js';
import type { BBTagArrayTools } from './utils/tagArray.js';

export interface InjectionContext {
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
    readonly services: BBTagQueryServices;
}

export interface BBTagQueryServices {
    readonly user: UserService;
    readonly role: RoleService;
    readonly channel: ChannelService;
    readonly message: MessageService;
    readonly guild: GuildService;
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
    embed: EmbedParser;
    bigInt(this: void, s: string | number | bigint): bigint | undefined;
    color(this: void, text: number | 'random' | string): number | undefined;
    time(this: void, text: 'now' | 'today' | 'tomorrow' | 'yesterday' | string, format?: string, timezone?: string): moment.Moment;
}

export interface BBTagUtilities {
    defaultPrefix: string;

    isUserStaff(member: Entities.User): Promise<boolean>;

    warn(member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    pardon(member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    ban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, deleteDays: number, reason: string, duration: moment.Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    timeout(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, duration: moment.Duration, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    clearTimeout(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User, reason?: string, color?: number): Promise<void>;

    setTimeout(context: BBTagContext, content: string, timeout: moment.Duration): Promise<void>;

    canRequestDomain(domain: string): boolean;
    generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<string>;
    websiteLink(path?: string): string;
}
