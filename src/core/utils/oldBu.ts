/* eslint-disable @typescript-eslint/naming-convention */
import moment from 'moment';
import config from '../../../config.json';
import { EventEmitter } from 'eventemitter3';
import ReadWriteLock from 'rwlock';
import { Client as ErisClient, User, Member, DiscordRESTError, DiscordHTTPError, Guild, Permission, GuildAuditLogEntry, AnyChannel, GuildMessage, AnyMessage } from 'eris';
import isSafeRegex from 'safe-regex';
import { parse } from './parse';
import limax from 'limax';
import { nfkd } from 'unorm';
import { humanize, fafo, randInt } from '../utils';
import { StoredTag } from '../database';
import { Logger } from '../Logger';
import { guard } from './guard';

const tagLock = Symbol('The key for a ReadWriteLock');
interface TagLocks {
    [key: string]: TagLocks;
    [tagLock]?: ReadWriteLock;
}

const console: Logger = <Logger><unknown>undefined;
const bot = <ErisClient><unknown>undefined;
const cluster = <NodeJS.Process & Required<Pick<NodeJS.Process, 'send'>>><unknown>process;
let awaitReactionCounter = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const oldBu = {
    commandMessages: {},
    notCommandMessages: {},
    bans: {} as Record<string, Record<string, { mod: User; type: string; reason: string; }>>,
    unbans: {},
    globalVars: {},
    commandStats: {},
    commandUses: 0,
    cleverbotStats: 0,
    messageStats: 0,
    awaitMessages: {} as { [key: string]: { [key: string]: string[] | undefined; } | undefined; },
    awaitReactions: {} as { [key: string]: { [key: string]: string[] | undefined; } | undefined; },
    tagLocks: {} as TagLocks,
    stats: {} as Record<string, unknown>,
    cleverStats: {},
    startTime: moment(),
    emitter: new EventEmitter(),
    events: new EventEmitter(),
    isNsfwChannel(channelid: string): boolean {
        const channel = bot.getChannel(channelid);
        if (channel !== undefined && 'nsfw' in channel)
            return channel.nsfw;
        return false;
    },
    compareStats(a: StoredTag, b: StoredTag): -1 | 0 | 1 {
        if (a.uses < b.uses)
            return -1;
        if (a.uses > b.uses)
            return 1;
        return 0;
    },
    async awaitReact(
        messages: string | string[],
        users: string | string[],
        reactions?: string[],
        check?: (message: GuildMessage, user: User, reaction: string) => Promise<boolean> | boolean,
        timeout?: number
    ): Promise<{ message: GuildMessage; user: User; emoji: string; }> {
        if (!Array.isArray(messages))
            messages = [messages];
        if (!Array.isArray(users))
            users = [users];
        if (reactions !== undefined) {
            if (!Array.isArray(reactions))
                reactions = [reactions];
            reactions = reactions.map(r => r.replace(/[<>]/g, ''));
        }
        const _check = check ?? (() => true);
        const _timeout = timeout ?? 300000;

        const eventName = `await_reaction_${awaitReactionCounter++}`;
        const eventReferences: string[][] = [];

        for (const message of messages) {
            const msg = oldBu.awaitReactions[message] ?? (oldBu.awaitReactions[message] = {});
            for (const user of users) {
                const usr = msg[user] ??= [];
                usr.push(eventName);
                eventReferences.push(usr);
            }
        }

        oldBu.emitter.removeAllListeners(eventName);

        console.debug(`awaiting reaction | messages: [${messages.join(',')}] users: [${users.join(',')}] reactions: ${JSON.stringify(reactions)} timeout: ${_timeout}`);

        const watchFor = reactions !== undefined ? reactions.map(r => {
            const match = SANITIZED.exec(r);
            if (match !== null)
                return match[1];
            return r;
        }) : undefined;

        return await new Promise<{ message: GuildMessage; user: User; emoji: string; }>((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new TimeoutError(_timeout)), _timeout);

            oldBu.emitter.on(eventName, fafo(async (message: GuildMessage, emoji: string, user: User) => {
                let sanitized = emoji;
                const match = SANITIZED.exec(sanitized);
                if (match !== null)
                    sanitized = match[1];

                console.log('Received reaction event:', eventName, sanitized, watchFor);
                try {
                    if (watchFor !== undefined && !watchFor.includes(sanitized))
                        return;
                    if (await _check(message, user, emoji)) {
                        clearTimeout(timeoutId);
                        resolve({ message, user, emoji });
                    }
                } catch (err: unknown) {
                    clearTimeout(timeoutId);
                    reject(err);
                }
            }));
        }).finally(function () {
            oldBu.emitter.removeAllListeners(eventName);
            for (const ref of eventReferences) {
                const index = ref.indexOf(eventName);
                if (index !== -1) {
                    ref.splice(index, 1);
                }
            }
        });
    },
    hasRole(
        msg: GuildMessage | Member,
        roles: string | readonly string[],
        override = true
    ): boolean {
        const member = msg instanceof Member ? msg : msg.member;
        if (override && (member.id === config.discord.users.owner ||
            member.guild.ownerID === member.id ||
            member.permissions.json.administrator)) {
            return true;
        }
        if (typeof roles === 'string')
            roles = [roles];
        for (const role of roles) {
            if (member.roles.includes(role)) {
                return true;
            }
        }
        return false;
    },
    async addReactions(
        channelId: string,
        messageId: string,
        reactions: string[]
    ): Promise<Record<number, { error: unknown; reactions: string[]; }>> {
        const errors = {} as Record<number, { error: unknown; reactions: string[]; }>;
        for (const reaction of new Set(reactions)) {
            try {
                await bot.addMessageReaction(channelId, messageId, reaction);
            } catch (e: unknown) {
                if (e instanceof DiscordHTTPError || e instanceof DiscordRESTError) {
                    errors[e.code] ??= { error: e, reactions: [] };
                    switch (e.code) {
                        case 50013:
                            errors[e.code].reactions.push(...new Set(reactions));
                            return errors;
                        default:
                            errors[e.code].reactions.push(reaction);
                            break;
                    }
                } else {
                    throw e;
                }
            }
        }

        return errors;
    },

    async getUserById(userId: string): Promise<User | undefined> {
        const match = /\d{17,21}/.exec(userId);
        if (match !== null) {
            const user = bot.users.get(match[0]);
            if (user !== undefined) {
                return user;
            }
            try {
                return await bot.getRESTUser(match[0]);
            } catch (err: unknown) { return undefined; }

        }
        return undefined;
    },
    saveConfig(): void {
        oldBu.emitter.emit('saveConfig');
    },
    reloadUserList(): void {
        oldBu.emitter.emit('ircUserList');
    },
    getMemoryUsage(): number {
        const memory = process.memoryUsage();
        return memory.rss / 1024 / 1024;
    },
    shuffle(array: unknown[]): void {
        let i = 0;
        let j = 0;
        let temp = null;

        for (i = array.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    },
    padLeft(value: string, length: number): string {
        return value.toString().length < length ? oldBu.padLeft(' ' + value, length) : value;
    },
    padRight(value: string, length: number): string {
        return value.toString().length < length ? oldBu.padRight(value + ' ', length) : value;
    },
    async getAudit(guildId: string, targetId: string, type?: number): Promise<GuildAuditLogEntry | undefined> {
        try {
            const al = await bot.getGuildAuditLogs(guildId, 50, undefined, type);
            for (const e of al.entries) {
                if (e.targetID === targetId) {
                    return e;
                }
            }
            return undefined;
        } catch (err: unknown) {
            // may not have audit log perms
            return undefined;
        }
    },
    async filterMentions(message: string, guild: Guild): Promise<string> {
        let match: RegExpExecArray | null;
        while ((match = /<@!?([0-9]{17,21})>/.exec(message)) !== null) {
            const id = match[1];
            try {
                const user = bot.users.get(id) ?? await bot.getRESTUser(id);
                message = message.replace(new RegExp(`<@!?${id}>`), humanize.fullName(user));
            } catch (err: unknown) {
                message = message.replace(new RegExp(`<@!?${id}>`), `<@\u200b${id}>`);
            }
        }
        while ((match = /<#([0-9]{17,21})>/.exec(message)) !== null) {
            const id = match[1];
            const channel = bot.getChannel(id);
            if (guard.hasValue(channel) && 'name' in channel) {
                message = message.replace(new RegExp(`<#${id}>`), `#${channel.name}`);
            } else {
                message = message.replace(new RegExp(`<#${id}>`), `<#\u200b${id}>`);
            }
        }
        if (guard.hasValue(guild))
            while ((match = /<@&([0-9]{17,21})>/.exec(message)) !== null) {
                const id = match[1];
                const role = guild.roles.get(id);
                if (role !== undefined) {
                    message = message.replace(new RegExp(`<@&${id}>`), `${role.name}`);
                } else {
                    message = message.replace(new RegExp(`<@&${id}>`), `<@&\u200b${id}>`);
                }
            }
        return message;
    },
    getPerms(channelid: string): Permission['json'] | undefined {
        const channel = bot.getChannel(channelid);
        if (guard.hasValue(channel) && 'guild' in channel) {
            const permission = channel.permissionsOf(bot.user.id);
            return permission.json;
        }
        return undefined;

    },
    genToken(length: number): string {
        if (length === 0)
            length = 7;
        let output = '';
        for (let i = 0; i < length; i++) {
            output += tokenChoices[randInt(0, tokenChoices.length - 1)];
        }
        return output;
    },
    async awaitEvent(obj: Record<string, unknown>): Promise<unknown> {
        return await new Promise((fulfill, reject) => {
            cluster.send(obj);
            oldBu.emitter.once(<string>obj.code, fulfill);

            setTimeout(() => {
                reject('Timed out after 60 seconds');
            }, 60000);
        });
    },
    createRegExp(term: string): RegExp {
        if (term.length > 2000)
            throw new Error('Regex too long');
        const regexList = /^\/?(.*)\/(.*)/.exec(term);
        if (regexList !== null) {
            const temp = new RegExp(regexList[1], regexList[2]);
            if (!isSafeRegex(temp)) {
                throw new Error('Unsafe Regex');
            }
            return temp;
        }
        throw new Error('Invalid Regex');
    },
    fixContent(content: string): string {
        const tempContent = content.split('\n');
        for (let i = 0; i < tempContent.length; i++) {
            tempContent[i] = tempContent[i].trim();
        }
        return tempContent.join('\n');
    },
    isBoolean(value: unknown): value is boolean {
        return typeof value === 'boolean';
    },
    parseChannel(text: string, allowJustId = false): AnyChannel | undefined {
        const id = parse.entityId(text, '#', allowJustId);
        if (id === undefined) return undefined;
        return bot.getChannel(id);
    },
    groupBy<T, K extends string | number | symbol>(values: IterableIterator<T>, selector: (value: T) => K): Array<T[] & { key: K; }> {
        const groups: Partial<Record<K, T[] & { key: K; }>> = {};
        const keys = new Set<K>();
        for (const value of values) {
            const key = selector(value);
            let group = groups[key];
            if (group === undefined) {
                keys.add(key);
                group = groups[key] = <T[] & { key: K; }><unknown>[];
                group.key = key;
            }
            group.push(value);
        }

        return [...keys]
            .map(k => groups[k])
            .filter((i): i is T[] & { key: K; } => i !== undefined);
    },
    decancer(text: string): string {
        text = nfkd(text);
        text = limax(text, {
            replacement: ' ',
            tone: false,
            separateNumbers: false,
            maintainCase: true,
            custom: ['.', ',', ' ', '!', '\'', '"', '?']
        });
        return text;
    },

    async findMessages(channelId: string, count: number, filter?: (m: AnyMessage) => boolean, before?: string, after?: string): Promise<AnyMessage[]> {
        const result = [];
        filter = filter ?? (() => true);

        while (result.length < count) {
            const batchSize = Math.min(100, count - result.length);
            const batch = await bot.getMessages(channelId, batchSize, before, after);
            result.push(...batch);

            if (batch.length !== batchSize)
                break;

            before = result[result.length - 1].id;
        }

        return result.filter(filter);
    }
};

class TimeoutError extends Error {
    public constructor(
        public readonly timeout: number
    ) {
        super('Action timed out');
    }
}

const SANITIZED = /(\w+:\d+)/;

const tokenChoices = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
