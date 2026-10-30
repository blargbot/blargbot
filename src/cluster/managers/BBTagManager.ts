import { randomUUID } from 'node:crypto';

import type { BBTagExpression, BBTagInput, Embed, SourceMarker, SubtagCall } from '@blargbot/bbtag-engine';
import { bbtag, BBTagContext, BBTagRuntimeError, ChannelType, createTagVariableScopeFactory, DiscordPermissions, getLock, SubtagProvider, subtags, templates, VariablesProvider } from '@blargbot/bbtag-engine';
import * as Subtags from '@blargbot/bbtag-engine/subtags';
import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import { createSafeRegExp, guard, humanize, metrics, parse, snowflake } from '@blargbot/core';
import Emote from '@blargbot/discord-emote';
import type { FlagDefinition, TagEventOptions } from '@blargbot/domain';
import { TagVariableType } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import { memoize, raceAsyncIterable, sleep, Timer, usingTimeout } from '@blargbot/util';
import Brainfuck from 'brainfuck-node';
import type { FileContent } from 'eris';
import Eris from 'eris';
import moment from 'moment-timezone';

import { BaseRuntimeLimit } from '../bbtagLimits/BaseRuntimeLimit.js';
import { rules } from '../bbtagLimits/index.js';
import type { RuntimeLimit, SerializedRuntimeLimit } from '../bbtagLimits/RuntimeLimit.js';
import { SubtagCallStack } from '../bbtagLimits/SubtagCallStack.js';
import type { Cluster } from '../Cluster.js';

type SubtagFeatures = typeof subtags[keyof typeof subtags] extends new (arg: infer R) => unknown ? R : never;

type BBTagFlagDefinition = Pick<FlagDefinition<unknown>, 'flag' | 'word'>;

export interface BBTagRuntimeInput {
    readonly cooldown: number;
    readonly author: string | undefined;
    readonly authorizer: string;
    readonly prefix: string | undefined;
    readonly isCC: boolean;
    readonly tagVars: boolean;
    readonly tagName: string;
    readonly flagDefinitions: readonly BBTagFlagDefinition[];
    readonly input: string;
    readonly limit: RuntimeLimit;
    readonly messageId: string;
    readonly guildId: string;
    readonly channelId: string;
    readonly userId: string;
    readonly silent: boolean;
}

export interface ClusterBBTagContextMetadata {
    dbCommitted: number;
    subtagCount: number;
    readonly flags: readonly BBTagFlagDefinition[];
    readonly invocations: Map<string, number[]>;
    readonly execTimer: Timer;
    readonly dbTimer: Timer;
    readonly limit: RuntimeLimit;
    readonly callStack: SubtagCallStack;
    readonly context: BBTagContext;
}

export interface ExecutionResult {
    content: IFormattable<string>;
    file: FileContent[];
}

export interface AnalysisResults {
    readonly errors: AnalysisResult[];
    readonly warnings: AnalysisResult[];
}

export interface AnalysisResult {
    readonly location: SourceMarker;
    readonly message: IFormattable<string>;
}

export class BBTagManager {
    readonly #cluster: Cluster;
    readonly #cooldowns = new Map<string, Temporal.Instant>();
    readonly #bfClient = new Brainfuck();
    readonly #metadata = new WeakMap<BBTagContext, ClusterBBTagContextMetadata>();

    public readonly variables: VariablesProvider;
    public readonly subtags: SubtagProvider;

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
        this.variables = this.#createVariablesProvider();
        const features = Object.freeze(this.#createFeatures());
        this.subtags = new SubtagProvider(
            Object.values(subtags)
                .map(subtag => new subtag(features))
        );
    }

    public async resume(options: TagEventOptions): Promise<void> {
        const deserialized = await this.#deserialize(options.version ?? 0, JSON.parse(options.context));
        if (deserialized === undefined)
            return;
        deserialized.metadata.limit.addRules(['timer', 'output'], rules.disabledRule);
        const expr = bbtag.parse(options.content);
        const result = await deserialized.context.eval(expr);
        await this.variables.forContext(deserialized.context).persist();
        await Subtags.OutputSubtag.sendOutput(deserialized.context, result);
    }

    public async execute(source: string, options: BBTagRuntimeInput): Promise<ExecutionResult> {
        const { isCC, tagName } = options;
        this.#cluster.logger.bbtag(`Start running ${isCC ? 'CC' : 'tag'} ${tagName}`);
        const timer = new Timer().start();
        const ast = bbtag.parse(source);
        this.#cluster.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const { context, metadata } = this.#createContext(options);
        this.#cluster.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        let content: string;
        const cooldown = this.#checkCooldown({
            guildId: context.root.guildId,
            userId: context.root.userId,
            tagName: context.local.tagName,
            isCC: context.root.isCC,
            cooldownMs: options.cooldown
        });
        if (cooldown !== false) {
            const unixTimestamp = Temporal.Instant.fromEpochMilliseconds(0).add(cooldown).epochMilliseconds;
            await Subtags.OutputSubtag.sendOutput(context, `This ${context.root.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again <t:${unixTimestamp}:R>.`);
        } else {
            metadata.execTimer.start();
            content = await context.eval(ast);
            if (context.root.output.replace !== undefined)
                content = await context.root.output.replace(content);
            metadata.execTimer.end();
            this.#cluster.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
            await this.variables.forContext(context).persist();
            this.#cluster.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
            await Subtags.OutputSubtag.sendOutput(context, content);
            this.#cluster.logger.bbtag(`Sent final output in ${timer.poll(true)}ms`);
        }

        return {
            content: templates.debug.summary({
                active: metadata.execTimer.elapsed,
                committed: metadata.dbCommitted,
                database: metadata.dbTimer.elapsed,
                total: metadata.execTimer.duration
                    .add(metadata.dbTimer.duration)
                    .total({ unit: 'milliseconds' })
            }),
            file: [
                {
                    name: 'bbtag.debug.json',
                    file: Buffer.from(JSON.stringify({
                        tagName: options.tagName,
                        userInput: options.input,
                        code: source,
                        loadedSources: [
                            ...context.root.tagCache.keys().map(k => `tag_${k}`),
                            ...context.root.ccCache.keys().map(k => `cc_${k}`)
                        ],
                        debug: context.debug.map(e => ({
                            details: e.text,
                            subtag: subtagLocation(e.subtag)
                        })),
                        errors: context.errors.map(e => ({
                            error: e.error.message,
                            details: e.error.detail,
                            subtag: readableSubtag(e.subtag)
                        })),
                        variables: this.variables.forContext(context).list.reduce<JObject>((v, c) => {
                            if (c.value !== undefined)
                                v[c.key] = c.value;
                            return v;
                        }, {}),
                        performance: performance
                    }, undefined, 2))
                }
            ]
        };
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        const statement = bbtag.parse(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.values.length === 0)
                result.warnings.push({ location: call.start, message: templates.analysis.unnamed });
            else if (call.name.values.every(v => typeof v === 'string')) {
                const subtag = this.subtags.find(call.name.values.join(''));
                // TODO Detect unknown subtags
                switch (typeof subtag?.deprecated) {
                    case 'boolean':
                        if (!subtag.deprecated)
                            break;
                    // fallthrough
                    case 'string':
                        result.warnings.push({ location: call.start, message: templates.analysis.deprecated(subtag) });
                }
            } else
                result.warnings.push({ location: call.start, message: templates.analysis.dynamic });
        }

        return result;
    }

    static readonly #neverRun = Temporal.Instant.fromEpochMilliseconds(-100_000_000 * 24 * 60 * 60 * 1000);
    #checkCooldown(scope: Subtags.CooldownScope): Temporal.Duration | false {
        const key = `${scope.guildId}:${scope.isCC}:${scope.userId}:${scope.tagName}`;
        const start = this.#cooldowns.getOrInsert(key, BBTagManager.#neverRun);
        const end = start.add({ milliseconds: scope.cooldownMs });
        const now = Temporal.Now.instant();
        const diff = now.until(end);
        if (diff.sign > 0)
            return diff;
        this.#cooldowns.set(key, now);
        return false;
    }

    #assertCooldown(scope: Subtags.CooldownScope): void {
        const diff = this.#checkCooldown(scope);
        if (diff !== false)
            throw new TagCooldownError(scope.tagName, scope.isCC, diff);
    }

    #createContext(options: BBTagRuntimeInput): { context: BBTagContext; metadata: ClusterBBTagContextMetadata; } {
        const metadata: ClusterBBTagContextMetadata = {
            subtagCount: 0,
            dbCommitted: 0,
            flags: options.flagDefinitions,
            invocations: new Map(),
            dbTimer: new Timer(),
            execTimer: new Timer(),
            limit: options.limit,
            callStack: new SubtagCallStack(),
            context: new BBTagContext(
                this.subtags,
                {
                    step: () => {
                        if (++metadata.subtagCount === 1000)
                            return sleep(0);
                        return undefined;
                    },
                    internalServerError: error => {
                        if (error instanceof RangeError)
                            throw error;
                        this.#cluster.logger.error(error);
                    },
                    subtagExecuting: async (subtag, call) => {
                        await metadata.limit.check(metadata, subtag.name);
                        const frame = metadata.callStack.push(subtag.name, call);
                        const start = performance.now();
                        return {
                            [Symbol.dispose]: memoize(() => {
                                using _ = frame;
                                const elapsed = performance.now() - start;
                                metrics.subtagLatency.labels(subtag.name).observe(elapsed);
                                metrics.subtagCounter.labels(subtag.name).inc();
                                metadata.invocations.getOrInsert(subtag.name, []).push(elapsed);
                            })
                        };
                    },
                    loop: async subtag => {
                        await metadata.limit.check(metadata, `${subtag.name}:loops`);
                    }
                },
                {
                    botId: this.#cluster.discord.user.id,
                    guildId: options.guildId,
                    messageId: options.messageId,
                    channelId: options.channelId,
                    userId: options.userId,
                    recursion: {
                        depth: 0
                    },
                    output: {
                        nsfw: undefined,
                        messageId: undefined,
                        embeds: undefined,
                        files: undefined,
                        replace: undefined,
                        reactions: []
                    },
                    authorId: options.author,
                    authorizerId: options.authorizer,
                    prefix: options.prefix,
                    isCC: options.isCC,
                    tagVars: options.tagVars,
                    silent: options.silent,
                    functions: new Map(),
                    queryCache: {
                        failedQueries: 0,
                        user: new Map(),
                        role: new Map(),
                        channel: new Map()
                    },
                    ownedMessageIds: new Set([options.messageId]),
                    tagCache: new Map(),
                    ccCache: new Map(),
                    allowedMentions: {
                        users: new Set(),
                        roles: new Set(),
                        everybody: false
                    },
                    tagName: options.tagName,
                    quiet: undefined,
                    fallback: undefined,
                    noLookupErrors: undefined,
                    reason: undefined,
                    inLock: false,
                    paramsarray: undefined,
                    reaction: undefined,
                    reactUser: undefined,
                    input: this.#parseInput(options.input, options.flagDefinitions)
                }
            )
        };
        this.#metadata.set(metadata.context, metadata);
        return { context: metadata.context, metadata };
    }

    #parseInput(input: string, flags: readonly BBTagFlagDefinition[]): BBTagInput {
        const flagged = parse.flags(flags, input);
        const result = {
            array: humanize.smartSplit(input),
            flags: { _: '' } as Mutable<BBTagInput['flags']>
        };
        for (const [flag, value] of Object.entries(flagged))
            if (value !== undefined)
                result.flags[flag] = value.merge().value;
        return result;
    }

    #serialize(context: BBTagContext): string {
        const { local, root } = context;
        const metadata = this.#metadata.get(context)!;
        const serialized: BBTagSerializedContextV4 = {
            msg: {
                id: root.messageId,
                timestamp: 0,
                content: '',
                channel: {
                    id: root.channelId,
                    serialized: JSON.stringify({ id: root.channelId })
                },
                member: {
                    id: root.userId,
                    serialized: JSON.stringify({ id: root.userId })
                },
                attachments: [],
                embeds: []
            },
            isCC: root.isCC,
            scope: {
                functions: Object.fromEntries(root.functions),
                isTag: false,
                inLock: local.inLock,
                fallback: local.fallback,
                noLookupErrors: local.noLookupErrors,
                paramsarray: local.paramsarray?.slice(),
                quiet: local.quiet,
                reaction: local.reaction,
                reactUser: local.reactUser,
                reason: local.reason
            },
            inputRaw: humanize.smartSplit.inverse(local.input.array),
            data: {
                allowedMentions: {
                    everybody: root.allowedMentions.everybody,
                    roles: [...root.allowedMentions.roles],
                    users: [...root.allowedMentions.users]
                },
                ownedMsgs: [...root.ownedMessageIds],
                query: {
                    count: root.queryCache.failedQueries,
                    channel: Object.fromEntries(root.queryCache.channel),
                    role: Object.fromEntries(root.queryCache.role),
                    user: Object.fromEntries(root.queryCache.user)
                },
                stackSize: root.recursion.depth
            },
            prefix: root.prefix,
            flags: metadata.flags,
            tagName: local.tagName,
            rootTagName: root.tagName,
            tagVars: root.tagVars,
            author: root.authorId,
            authorizer: root.authorizerId,
            limit: metadata.limit.serialize(),
            tempVars: this.variables.forContext(context).list
                .filter(v => v.key.startsWith('~'))
                .reduce<Record<string, JToken>>((p, v) => {
                    if (v.value !== undefined)
                        p[v.key] = v.value;
                    return p;
                }, {})
        };
        return JSON.stringify(serialized);
    }

    async #deserialize(version: number, value: unknown): Promise<{ context: BBTagContext; metadata: ClusterBBTagContextMetadata; } | undefined> {
        if (version !== 4)
            return undefined;

        const obj = value as BBTagSerializedContextV4;
        let userId = obj.msg.member?.id;
        if (userId === undefined) {
            const message = await this.#cluster.util.getMessage(obj.msg.channel.id, obj.msg.id);
            if (message === undefined)
                throw new Error('No user found');
            userId = message.author.id;
        }
        const channel = await this.#cluster.util.getChannel(obj.msg.channel.id);
        if (channel === undefined || !('guild' in channel))
            throw new Error('Channel must be a guild channel to work with BBTag');

        const { context, metadata } = this.#createContext({
            author: obj.author,
            authorizer: obj.authorizer ?? obj.author ?? this.#cluster.discord.user.id,
            input: obj.inputRaw,
            isCC: obj.isCC,
            limit: BaseRuntimeLimit.deserialize(obj.limit),
            messageId: obj.msg.id,
            channelId: obj.msg.channel.id,
            userId,
            guildId: channel.guild.id,
            prefix: obj.prefix,
            silent: false,
            tagName: obj.tagName,
            tagVars: obj.tagVars,
            cooldown: 0,
            flagDefinitions: obj.flags
        });
        context.root.queryCache.failedQueries = obj.data.query.count;
        Object.entries(obj.data.query.channel).forEach(x => context.root.queryCache.channel.set(...x));
        Object.entries(obj.data.query.role).forEach(x => context.root.queryCache.role.set(...x));
        Object.entries(obj.data.query.user).forEach(x => context.root.queryCache.user.set(...x));
        obj.data.ownedMsgs.forEach(x => context.root.ownedMessageIds.add(x));
        obj.data.allowedMentions.roles.forEach(x => context.root.allowedMentions.roles.add(x));
        obj.data.allowedMentions.users.forEach(x => context.root.allowedMentions.users.add(x));
        context.root.allowedMentions.everybody = obj.data.allowedMentions.everybody;
        context.local.fallback = obj.scope.fallback;
        context.local.quiet = obj.scope.quiet;
        context.local.fallback = obj.scope.fallback;
        context.local.noLookupErrors = obj.scope.noLookupErrors;
        context.local.reason = obj.scope.reason;
        context.local.inLock = obj.scope.inLock;
        context.local.paramsarray = obj.scope.paramsarray;
        context.local.reaction = obj.scope.reaction;
        context.local.reactUser = obj.scope.reactUser;
        Object.entries(obj.scope.functions).forEach(x => context.root.functions.set(...x));
        const variables = this.variables.forContext(context);
        await Promise.all(Object.entries(obj.tempVars).map(x => variables.set(...x)));
        return { context, metadata };
    }

    #createFeatures(): SubtagFeatures {
        const cluster = (): Cluster => this.#cluster;
        return {
            variables: this.variables,
            get defaultPrefix() {
                return cluster().config.discord.defaultPrefix;
            },
            get fetch() {
                return cluster().fetch;
            },
            get sleep() {
                return sleep;
            },
            generateDumpLink: async ({ content, channelId }) => {
                const id = await this.#cluster.util.generateDumpPage({ content }, snowflake.parse(channelId));
                return new URL(this.#cluster.util.websiteLink(`dumps/${id}`));
            },
            getTag: async (name) => {
                const tag = await this.#cluster.database.tags.get(name);
                if (tag === undefined)
                    return undefined;
                return {
                    content: tag.content,
                    cooldown: tag.cooldown
                };
            },
            assertTagCooldown: (scope) => Promise.resolve(this.#assertCooldown(scope)),
            parseInput: (context, input) => {
                const flags = this.#metadata.get(context)?.flags ?? [];
                if (Array.isArray(input))
                    input = humanize.smartSplit.inverse(input);
                return this.#parseInput(input, flags);
            },
            getCustomCommand: async (guildId, name) => {
                const ccommand = await this.#cluster.database.guilds.getCommand(guildId, name);
                if (ccommand === undefined)
                    return undefined;
                if ('alias' in ccommand)
                    return 'alias';
                return {
                    content: ccommand.content,
                    cooldown: ccommand.cooldown
                };
            },
            getLock: (scope, name) => {
                return getLock(scope, name);
            },
            addModLog: async ({ guildId, targetId, moderatorId, action, color, reason }) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return;
                const target = this.#cluster.discord.users.get(targetId);
                if (target === undefined) return;
                const moderator = this.#cluster.discord.users.get(moderatorId);
                if (moderator === undefined) return;
                await this.#cluster.moderation.modLog.logCustom(guild, util.literal(action), target, moderator, util.literal(reason), color);
            },
            getPrefix: async (guildId) => {
                return await this.#cluster.database.guilds.getSetting(guildId, 'prefix');
            },
            getUserName: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                return user?.username;
            },
            canRequestDomain: (domain) => {
                return Promise.resolve(this.#cluster.domains.isWhitelisted(domain));
            },
            scheduleBBTag: async (context, code, timestamp: Temporal.Instant) => {
                const channel = context.root.channelId;
                const guild = this.#cluster.discord.channelGuildMap[channel];
                await this.#cluster.timeouts.insert('tag', {
                    version: 4,
                    source: guild,
                    channel: channel,
                    endtime: timestamp.epochMilliseconds,
                    context: this.#serialize(context),
                    content: code
                });
            },
            getCategoryChannels: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return guild?.channels.filter(c => c.type === ChannelType.GUILD_CATEGORY).map(x => x.id) ?? [];
            },
            getChannelCategory: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'parentID') ?? undefined;
            },
            createChannel: async (guildId, { name, type, ...options }) => {
                try {
                    const guild = await this.#cluster.util.getGuild(guildId);
                    if (guild === undefined)
                        return { success: false, reason: 'Guild is missing' };
                    const channel = await guild.createChannel(name, type, options) as Eris.GuildChannel;
                    return { success: true, channelId: channel.id };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            getMemberPermissions: async (guildId, userId, channelId?: string) => {
                const result = await this.#getUserPermissions(guildId, userId, channelId);
                return result.has('ADMINISTRATOR')
                    ? DiscordPermissions.NONE.inverse()
                    : result;
            },
            deleteChannel: async ({ guildId, channelId, ...options }) => {
                try {
                    const channel = await this.#getChannel(guildId, channelId);
                    if (channel === undefined)
                        return { success: false, reason: 'Channel doesnt exist.' };
                    await channel.delete(options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            editChannel: async ({ guildId, channelId, ...options }) => {
                try {
                    const channel = await this.#getChannel(guildId, channelId);
                    if (channel === undefined)
                        return { success: false, reason: 'Channel not found' };
                    await channel.edit(options);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            checkChannelExists: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'id') === channelId;
            },
            findChannel: async (guildId, searchText) => {
                const candidates = await this.#cluster.util.findChannels(guildId, searchText);
                return candidates.length === 1 ? candidates[0].id : undefined;
            },
            queryChannel: async (request) => {
                return await this.#queryEntity('Channel', 'channel', request);
            },
            getChannelType: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'type');
            },
            isChannelNsfw: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'nsfw');
            },
            getChannelName: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'name');
            },
            getChannelPosition: async (guildId, channelId) => {
                const channel = await this.#getChannel(guildId, channelId);
                if (channel === undefined) return undefined;
                if (guard.isThreadChannel(channel)) return 'thread';
                return channel.position;
            },
            listChannels: async (guildId, parentId?: string) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined)
                    return [];
                const channels = parentId === undefined
                    ? guild.channels
                    : guild.channels.filter(c => c.parentID === parentId);
                return channels.map(c => c.id);
            },
            setPermissionOverride: async (options) => {
                try {
                    const channel = await this.#getChannel(options.guildId, options.channelId);
                    if (channel === undefined)
                        return { success: false, reason: 'Channel not found' };
                    if ('allow' in options)
                        await channel.editPermission(options.entityId, options.allow, options.deny, options.type, options.auditReason);
                    else
                        await channel.deletePermission(options.entityId, options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            getLastMessageId: async (guildId, channelId) => {
                return await this.#getChannelProp(guildId, channelId, 'lastMessageID');
            },
            createEmoji: async (options) => {
                try {
                    const guild = await this.#cluster.util.getGuild(options.guildId);
                    const emoji = await guild?.createEmoji({
                        image: `data:${options.contentType};base64,${Buffer.from(options.image.buffer, options.image.byteOffset, options.image.byteLength).toString('base64')}`,
                        name: options.name,
                        roles: [...options.roles]
                    }, options.auditReason);
                    if (emoji === undefined)
                        return { success: false, cause: 'UNKNOWN', reason: 'Failed to create emoji' };
                    return { success: true, emojiId: emoji.id };
                } catch (error) {
                    const { reason } = this.#handleError(error);
                    if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
                    const parts = reason.split('\n');
                    return {
                        success: false,
                        cause: (parts[1] ?? parts[0]).trim(),
                        reason
                    };
                }
            },
            deleteEmoji: async (options) => {
                try {
                    const guild = await this.#cluster.util.getGuild(options.guildId);
                    const emoji = await guild?.deleteEmoji(options.emojiId, options.auditReason);
                    if (emoji === undefined)
                        return { success: false, cause: 'UNKNOWN', reason: 'Failed to delete emoji' };
                    return { success: true };
                } catch (error) {
                    const { reason } = this.#handleError(error);
                    if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
                    const parts = reason.split('\n');
                    return {
                        success: false,
                        cause: (parts[1] ?? parts[0]).trim(),
                        reason
                    };
                }
            },
            listEmojis: async (guildId, roleId?: string) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined)
                    return undefined;
                let emojis = guild.emojis;
                if (roleId !== undefined)
                    emojis = emojis.filter(x => x.roles.includes(roleId));
                return emojis.map(x => new Emote(x.name, BigInt(x.id), x.animated));
            },
            getBannedUsers: async (guildId) => {
                try {
                    const guild = await this.#cluster.util.getGuild(guildId);
                    if (guild === undefined) return undefined;
                    await this.#cluster.util.ensureGuildBans(guild);
                    return [...this.#cluster.util.getGuildBans(guild)];
                } catch (error) {
                    this.#handleError(error);
                    return undefined;
                }
            },
            getGuildCreatedTimestamp: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return this.#toTimestamp(guild, 'createdAt');
            },
            listGuildFeatures: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return guild?.features;
            },
            getGuildIcon: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                const url = guild?.iconURL;
                if (typeof url !== 'string')
                    return url;
                return new URL(url);
            },
            listGuildMembers: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return [];
                await this.#cluster.util.ensureMemberCache(guild);
                return guild.members.map(m => m.id);
            },
            getGuildName: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return guild?.name;
            },
            getGuildOwnerId: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return guild?.ownerID;
            },
            setGuildIcon: async (options) => {
                try {
                    const guild = await this.#cluster.util.getGuild(options.guildId);
                    const emoji = await guild?.edit({
                        icon: `data:${options.contentType};base64,${Buffer.from(options.image.buffer, options.image.byteOffset, options.image.byteLength).toString('base64')}`
                    }, options.auditReason);
                    if (emoji === undefined)
                        return { success: false, cause: 'UNKNOWN', reason: 'Failed to create emoji' };
                    return { success: true };
                } catch (error) {
                    const { reason } = this.#handleError(error);
                    if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
                    const parts = reason.split('\n');
                    return {
                        success: false,
                        cause: (parts[1] ?? parts[0]).trim(),
                        reason
                    };
                }
            },
            getGuildMemberCount: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return undefined;
                await this.#cluster.util.ensureMemberCache(guild);
                return guild.members.size;
            },
            deleteMessage: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                if (message === undefined)
                    return { success: false, cause: 'notFound' };
                try {
                    await message.delete();
                    return { success: true };
                } catch (error) {
                    const { reason } = this.#handleError(error);
                    return { success: false, cause: 'failed', reason };
                }
            },
            editMessage: async (options) => {
                const { channelId, messageId, ...data } = options;
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                if (message === undefined)
                    return { success: false, cause: 'failed', reason: 'Message doesnt exist.' };
                const { content = message.content, embeds = message.embeds } = options;
                if (content === '' && embeds.length === 0 && message.attachments.length === 0 && (message.components?.length ?? 0) === 0)
                    return { success: false, cause: 'messageEmpty', reason: 'Message is empty.' };

                try {
                    await message.edit({
                        ...data,
                        embeds: data.embeds?.map(toErisEmbed)
                    });
                    return { success: true };
                } catch (error) {
                    const { reason } = this.#handleError(error);
                    return { success: false, cause: 'failed', reason };
                }
            },
            getMessageAuthor: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return message?.author.id;
            },
            getMessageAttachmentUrls: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return message?.attachments.map(a => new URL(a.url));
            },
            getMessageEditTimestamp: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return this.#toTimestamp(message, 'editedTimestamp');
            },
            getMessageEmbeds: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return message?.embeds.map(fromErisEmbed);
            },
            getMessageReplyTarget: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                if (message === undefined)
                    return undefined;
                return message.referencedMessage?.id ?? null;
            },
            getMessageContent: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return message?.content;
            },
            getMessageTimestamp: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return this.#toTimestamp(message, 'timestamp');
            },
            getMessageType: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                return message?.type;
            },
            canPingEveryone: async (guildId) => {
                return await this.#cluster.database.guilds.getSetting(guildId, 'disableeveryone') !== true;
            },
            sendMessage: async (channelId, payload) => {
                try {
                    const channel = this.#cluster.discord.getChannel(channelId);
                    if (channel === undefined)
                        return { success: false, reason: 'Channel not found.' };
                    if (!guard.isTextableChannel(channel))
                        return { success: false, reason: 'Channel cannot receive messages.' };
                    const message = await this.#cluster.util.send(channel, util.literal({
                        content: payload.content,
                        embeds: payload.embeds?.map(({ timestamp, ...e }) => {
                            if (timestamp === undefined)
                                return e;
                            return {
                                ...e,
                                timestamp: timestamp.toString()
                            };
                        }),
                        file: payload.files,
                        allowedMentions: payload.allowedMentions !== undefined ? {
                            everyone: payload.allowedMentions.everyone,
                            roles: [...payload.allowedMentions.roles],
                            users: [...payload.allowedMentions.users]
                        } : undefined
                    }));
                    if (message === undefined)
                        return { success: false };
                    return { success: true, id: message.id };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            addMessageReactions: async (channelId, messageId, reactions: Iterable<Emote>) => {
                const channel = this.#cluster.discord.getChannel(channelId);
                if (channel === undefined || !guard.isTextableChannel(channel))
                    return { success: [], failed: [...reactions] };
                let message;
                try {
                    message = channel.messages.get(messageId) ?? await channel.getMessage(messageId);
                } catch {
                    return { success: [], failed: [...reactions] };
                }

                return await this.#cluster.util.addReactions(message, reactions);
            },
            checkMessageExists: async (channelId, messageId) => {
                return await this.#cluster.util.getMessage(channelId, messageId) !== undefined;
            },
            listMessageReactionUsers: async (channelId, messageId, reaction: Emote) => {
                try {
                    const message = await this.#cluster.util.getMessage(channelId, messageId);
                    const users = await message?.getReaction(reaction.toApi());
                    return users?.map(x => x.id);
                } catch (error) {
                    this.#handleError(error);
                    return [];
                }
            },
            listMessageReactions: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId, true);
                if (message === undefined)
                    return undefined;
                return Object.keys(message.reactions).map(v => Emote.parse(v));
            },
            removeMessageReactionUser: async (channelId, messageId, reaction: Emote, userId: string) => {
                try {
                    const message = await this.#cluster.util.getMessage(channelId, messageId);
                    await message?.removeReaction(reaction.toApi(), userId);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            removeMessageReactions: async (channelId, messageId) => {
                const message = await this.#cluster.util.getMessage(channelId, messageId);
                await message?.removeReactions();
            },
            streamMessages: (channelIds, timeoutMs) => {
                const abort = new AbortController();
                using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
                const messages = this.#cluster.awaiter.messages;
                const partitions = Iterator.from(channelIds).map(async function* (x) {
                    for await (const message of messages.getPartition(x)) {
                        yield {
                            messageId: message.id,
                            channelId: message.channel.id,
                            guildId: 'guild' in message.channel
                                ? message.channel.guild.id
                                : undefined,
                            authorId: message.author.id
                        };
                    }
                });
                return raceAsyncIterable(partitions, abort.signal);
            },
            streamReactions: (messageIds, timeoutMs) => {
                const abort = new AbortController();
                using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
                const partitions = Iterator.from(messageIds).map(x => this.#cluster.awaiter.reactions.getPartition(x));
                return raceAsyncIterable(partitions, abort.signal);
            },
            executeWebhook: async (webhookId, webhookToken, payload: Subtags.ExecuteWebhookPayload) => {
                try {
                    await this.#cluster.discord.executeWebhook(webhookId, webhookToken, {
                        ...payload,
                        embeds: payload.embeds?.map(toErisEmbed)
                    });
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            executeBrainfuck: async (code, input) => {
                return await Promise.resolve(this.#bfClient.execute(code, input).output);
            },
            compileRegex: (pattern, flags) => {
                const result = createSafeRegExp(`/${pattern}/${flags}`);
                switch (result.state) {
                    case 'success':
                        return Promise.resolve({
                            success: true,
                            regex: {
                                match: text => Promise.resolve(text.match(result.regex) ?? []),
                                replace: (text, replacement) => Promise.resolve(text.replaceAll(result.regex, replacement)),
                                split: text => Promise.resolve(text.split(result.regex)),
                                test: text => Promise.resolve(result.regex.test(text))
                            }
                        });
                    default:
                        return Promise.resolve({ success: false, cause: result.state });
                }
            },
            addMemberRoles: async (options) => {
                try {
                    const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
                    if (member === undefined) return { success: false, reason: 'Member not found.' };
                    const roles = new Set([...options.roleIds, ...member.roles]);
                    if (roles.size === member.roles.length)
                        return { success: false, reason: 'No roles added' };
                    await member.edit({ roles: [...roles] }, options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            listMemberRoles: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                return member?.roles;
            },
            listGuildRoles: async (guildId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                return guild?.roles.map(r => r.id) ?? [];
            },
            getRoleColor: async (guildId, roleId) => {
                const role = await this.#cluster.util.getRole(guildId, roleId);
                return role?.color;
            },
            createRole: async (options) => {
                try {
                    const guild = await this.#cluster.util.getGuild(options.guildId);
                    if (guild === undefined) return { success: false, reason: 'Guild not found' };
                    const role = await guild.createRole({
                        name: options.name,
                        color: options.color,
                        hoist: options.hoist,
                        mentionable: options.mentionable,
                        permissions: options.permissions.raw
                    }, options.auditReason);
                    return { success: true, roleId: role.id };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            deleteRole: async (options) => {
                try {
                    const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
                    if (role === undefined) return { success: false, reason: 'Role not found' };
                    await role.delete(options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            checkRoleExists: async (guildId, roleId) => {
                const role = await this.#cluster.util.getRole(guildId, roleId);
                return role !== undefined;
            },
            findRole: async (guildId, searchText) => {
                const candidates = await this.#cluster.util.findRoles(guildId, searchText);
                return candidates.length === 1 ? candidates[0].id : undefined;
            },
            queryRole: async (request) => {
                return await this.#queryEntity('Role', 'role', request);
            },
            listRoleMembers: async (guildId, roleId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return [];
                await this.#cluster.util.ensureMemberCache(guild);
                return guild.members.filter(m => m.roles.includes(roleId))
                    .map(m => m.id);
            },
            getRoleName: async (guildId, roleId) => {
                const role = await this.#cluster.util.getRole(guildId, roleId);
                return role?.name;
            },
            getRolePermissions: async (guildId, roleId) => {
                const role = await this.#cluster.util.getRole(guildId, roleId);
                if (role === undefined)
                    return undefined;
                return new DiscordPermissions(role.permissions.allow);
            },
            getRolePosition: async (guildId, roleId) => {
                const role = await this.#cluster.util.getRole(guildId, roleId);
                return role?.position;
            },
            removeMemberRoles: async (options) => {
                try {
                    const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
                    if (member === undefined) return { success: false, reason: 'Member not found.' };
                    const roles = new Set(member.roles).difference(new Set(options.roleIds));
                    if (roles.size === member.roles.length)
                        return { success: false, reason: 'No roles removed' };
                    await member.edit({ roles: [...roles] }, options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            editRole: async ({ guildId, roleId, auditReason, ...options }) => {
                try {
                    const role = await this.#cluster.util.getRole(guildId, roleId);
                    if (role === undefined) return { success: false, reason: 'Role not found' };
                    await role.edit({ color: options.color }, auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            setRolePosition: async (options) => {
                try {
                    const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
                    if (role === undefined) return { success: false, reason: 'Role not found' };
                    await role.editPosition(options.position);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            getRoleMemberCount: async (guildId, roleId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return undefined;
                await this.#cluster.util.ensureMemberCache(guild);
                return guild.members.reduce((p, c) => c.roles.includes(roleId) ? p + 1 : p, 0);
            },
            banUser: async (options) => {
                const { guildId, targetId, moderatorId, authorizerId, daysToDelete, auditReason: reason, unbanAfter } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return { success: false, cause: 'bot' };
                const target = await this.#cluster.util.getUser(targetId);
                if (target === undefined) return { success: false, cause: 'bot' };
                const moderator = await this.#cluster.util.getUser(moderatorId);
                if (moderator === undefined) return { success: false, cause: 'authorizer' };
                const authorizer = await this.#cluster.util.getUser(authorizerId);
                if (authorizer === undefined) return { success: false, cause: 'authorizer' };
                const result = await this.#cluster.moderation.bans.ban(
                    guild,
                    target,
                    moderator,
                    authorizer,
                    daysToDelete,
                    util.literal(reason),
                    this.#toMomentDuration(unbanAfter) ?? moment.duration(Infinity)
                );
                switch (result) {
                    case 'success':
                    case 'alreadyBanned':
                        return { success: true };
                    case 'memberTooHigh':
                    case 'noPerms':
                        return { success: false, cause: 'bot' };
                    case 'moderatorNoPerms':
                    case 'moderatorTooLow':
                        return { success: false, cause: 'authorizer' };
                    default:
                        return { success: false, cause: result };
                }
            },
            getDmChannelId: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                return (await user?.getDMChannel())?.id;
            },
            isUserStaff: async (guildId, userId) => {
                const guild = await this.#cluster.util.getGuild(guildId);
                const member = guild?.members.get(userId);
                if (member === undefined)
                    return false;
                return await this.#cluster.util.isUserStaff(member);
            },
            getMemberBoostTimestamp: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                return this.#toTimestamp(member, 'premiumSince');
            },
            kickMember: async (options) => {
                const { guildId, targetId, moderatorId, authorizerId, auditReason: reason } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return { success: false, cause: 'bot' };
                const target = guild.members.get(targetId);
                if (target === undefined) return { success: false, cause: 'bot' };
                const moderator = await this.#cluster.util.getUser(moderatorId);
                if (moderator === undefined) return { success: false, cause: 'authorizer' };
                const authorizer = await this.#cluster.util.getUser(authorizerId);
                if (authorizer === undefined) return { success: false, cause: 'authorizer' };
                const result = await this.#cluster.moderation.bans.kick(target, moderator, authorizer, util.literal(reason));
                switch (result) {
                    case 'success':
                        return { success: true };
                    case 'noPerms':
                    case 'memberTooHigh':
                        return { success: false, cause: 'bot' };
                    case 'moderatorNoPerms':
                    case 'moderatorTooLow':
                        return { success: false, cause: 'authorizer' };
                    default:
                        return { success: false, cause: result };
                }
            },
            pardonUser: async (options) => {
                const { guildId, targetId, moderatorId, count, reason } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return 0;
                const target = guild.members.get(targetId);
                if (target === undefined) return 0;
                const moderator = this.#cluster.discord.users.get(moderatorId);
                if (moderator === undefined) return 0;
                const result = await this.#cluster.moderation.warns.pardon(target, moderator, count, util.literal(reason));
                return result.warnings;
            },
            setMemberTimeout: async (options) => {
                const { guildId, targetId, moderatorId, authorizerId, reason, duration } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return { success: false, cause: 'bot' };
                const target = guild.members.get(targetId);
                if (target === undefined) return { success: false, cause: 'bot' };
                const moderator = await this.#cluster.util.getUser(moderatorId);
                if (moderator === undefined) return { success: false, cause: 'authorizer' };
                const authorizer = await this.#cluster.util.getUser(authorizerId);
                if (authorizer === undefined) return { success: false, cause: 'authorizer' };
                const result = duration.sign === 0
                    ? await this.#cluster.moderation.timeouts.clearTimeout(target, moderator, authorizer, util.literal(reason))
                    : await this.#cluster.moderation.timeouts.timeout(target, moderator, authorizer, this.#toMomentDuration(duration), util.literal(reason));
                switch (result) {
                    case 'success':
                        return { success: true };
                    case 'alreadyTimedOut':
                    case 'notTimedOut':
                        return { success: false, cause: 'noChange' };
                    case 'noPerms':
                    case 'memberTooHigh':
                        return { success: false, cause: 'bot' };
                    case 'moderatorNoPerms':
                    case 'moderatorTooLow':
                        return { success: false, cause: 'authorizer' };
                    default:
                        return { success: false, cause: result };
                }
            },
            unbanUser: async (options) => {
                const { guildId, targetId, moderatorId, authorizerId, auditReason: reason } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return { success: false, cause: 'bot' };
                const target = await this.#cluster.util.getUser(targetId);
                if (target === undefined) return { success: false, cause: 'notBanned' };
                const moderator = await this.#cluster.util.getUser(moderatorId);
                if (moderator === undefined) return { success: false, cause: 'authorizer' };
                const authorizer = await this.#cluster.util.getUser(authorizerId);
                if (authorizer === undefined) return { success: false, cause: 'authorizer' };
                const result = await this.#cluster.moderation.bans.unban(guild, target, moderator, authorizer, util.literal(reason));
                switch (result) {
                    case 'success':
                        return { success: true };
                    case 'notBanned':
                        return { success: false, cause: 'notBanned' };
                    case 'noPerms':
                        return { success: false, cause: 'bot' };
                    case 'moderatorNoPerms':
                        return { success: false, cause: 'authorizer' };
                    default:
                        return { success: false, cause: result };
                }
            },
            getMemberActivityName: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                if (member === undefined)
                    return undefined;
                return member.activities?.[0]?.name ?? null;
            },
            getMemberActivityType: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                if (member === undefined)
                    return undefined;
                return member.activities?.[0]?.type ?? null;
            },
            getUserAvatarUrl: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                if (user === undefined)
                    return undefined;
                return new URL(user.avatarURL);
            },
            getUserCreatedTimestamp: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                return this.#toTimestamp(user, 'createdAt');
            },
            checkMemberExists: async (guildId, userId) => {
                return await this.#cluster.util.getMember(guildId, userId) !== undefined;
            },
            checkUserExists: async (userId) => {
                return await this.#cluster.util.getUser(userId) !== undefined;
            },
            findMember: async (guildId, searchText) => {
                const candidates = await this.#cluster.util.findMembers(guildId, searchText);
                return candidates.length === 1 ? candidates[0].id : undefined;
            },
            queryMember: async (request) => {
                return await this.#queryEntity('Member', 'user', request);
            },
            checkUserIsBot: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                return user?.bot;
            },
            getMemberJoinTimestamp: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                return this.#toTimestamp(member, 'joinedAt') ?? undefined;
            },
            getMemberNickname: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                return member?.nick;
            },
            getUserNickname: async (userId) => {
                const user = await this.#cluster.util.getUser(userId);
                return user === undefined ? undefined : null;
            },
            setMemberNickname: async (options) => {
                try {
                    const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
                    if (member === undefined) return { success: false, reason: 'Member not found.' };
                    await member.edit({ nick: options.nickname }, options.auditReason);
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            setMemberRoles: async (options) => {
                try {
                    const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
                    if (member === undefined) return { success: false, reason: 'Member not found.' };
                    const roles = new Set(options.roleIds);
                    if (roles.symmetricDifference(new Set(member.roles)).size === 0)
                        return { success: false, reason: 'No roles changed' };
                    await member.edit({ roles: [...roles] });
                    return { success: true };
                } catch (error) {
                    return this.#handleError(error);
                }
            },
            getMemberStatus: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                if (member === undefined)
                    return undefined;
                return member.status ?? 'offline';
            },
            getMemberTimeout: async (guildId, userId) => {
                const member = await this.#cluster.util.getMember(guildId, userId);
                if (member === undefined)
                    return undefined;
                const timeout = member.communicationDisabledUntil;
                return timeout !== null ? Temporal.Instant.fromEpochMilliseconds(timeout) : null;
            },
            getUserTimezone: async (userId) => {
                return await this.#cluster.database.users.getProp(userId, 'timezone');
            },
            warnUser: async (options) => {
                const { guildId, targetId, moderatorId, count, reason } = options;
                const guild = await this.#cluster.util.getGuild(guildId);
                if (guild === undefined) return 0;
                const target = guild.members.get(targetId);
                if (target === undefined) return 0;
                const moderator = this.#cluster.discord.users.get(moderatorId);
                if (moderator === undefined) return 0;
                const result = await this.#cluster.moderation.warns.warn(target, moderator, this.#cluster.discord.user, count, util.literal(reason));
                return result.warnings;
            },
            getWarnings: async (guildId, userId) => {
                return await this.#cluster.database.guilds.getWarnings(guildId, userId);
            }
        };
    }

    async #getChannelProp<Prop extends KeysOfUnion<Eris.KnownChannel>>(guildId: string, channelId: string, prop: Prop): Promise<ValueOfUnion<Eris.KnownChannel, Prop> | undefined> {
        const channel = await this.#getChannel(guildId, channelId);
        if (channel === undefined || !(prop in channel))
            return undefined;
        return channel[prop as never];
    }

    async #getChannel(guildId: string, channelId: string): Promise<Eris.KnownGuildChannel | undefined> {
        if (!snowflake.test(guildId) || !snowflake.test(channelId))
            return undefined;
        const channel = await this.#cluster.util.getChannel(channelId);
        if (channel === undefined || !('guild' in channel) || channel.guild.id !== guildId)
            return undefined;
        return channel;
    }

    async #queryEntity<Kind extends 'Channel' | 'Role' | 'Member'>(kind: Kind, kindName: string, options: Subtags.QueryEntityRequest): Promise<Subtags.QueryEntityResponse> {
        type Entity = {
            ['Channel']: Eris.KnownGuildChannel;
            ['Role']: Eris.Role;
            ['Member']: Eris.Member;
        }[Kind];
        type ChooseFn = (options: EntityPickQueryOptions<IFormattable<string>, Entity>) => Promise<ChoiceQueryResult<Entity>>;
        const candidates = await this.#cluster.util[`find${kind}s`](options.guildId, options.searchText) as Entity[];
        if (candidates.length === 1)
            return { success: true, id: candidates[0].id };
        const channel = await this.#cluster.util.getChannel(options.channelId);
        if (channel === undefined || !guard.isTextableChannel(channel))
            return { success: false, cause: 'aborted' };
        if (candidates.length === 0) {
            if (options.source !== undefined) {
                await this.#cluster.util.send(channel, util.literal({
                    content: `No ${kindName} matching \`${options.searchText}\` found in ${options.source}.`
                }));
            }
            return { success: false, cause: 'notFound' };
        }

        const result = await (this.#cluster.util[`query${kind}`] as ChooseFn)({
            context: channel,
            actors: [options.userId],
            choices: candidates,
            filter: options.searchText
        });
        switch (result.state) {
            case 'SUCCESS':
                return { success: true, id: result.value.id };
            case 'CANCELLED':
            case 'TIMED_OUT':
                return { success: false, cause: 'aborted' };
            case 'FAILED':
            case 'NO_OPTIONS':
                return { success: false, cause: 'notFound' };
            default:
                return { success: false, cause: result };
        }
    }

    async #getUserPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (userId === guild?.ownerID)
            return DiscordPermissions.NONE.inverse();

        if (channelId === undefined)
            return new DiscordPermissions(guild?.members.get(userId)?.permissions.allow ?? 0n);

        const channel = guild?.channels.get(channelId);
        return new DiscordPermissions(channel?.permissionsOf(userId).allow ?? 0n);
    }

    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number } | undefined, prop: Prop): Temporal.Instant | undefined
    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number | null } | undefined, prop: Prop): Temporal.Instant | undefined | null
    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number | null } | undefined, prop: Prop): Temporal.Instant | undefined | null {
        const value = target?.[prop];
        switch (value) {
            case undefined: return undefined;
            case null: return null;
            default: return Temporal.Instant.fromEpochMilliseconds(value);
        }
    }

    #toMomentDuration(duration: Temporal.Duration): moment.Duration
    #toMomentDuration(duration: Temporal.Duration | undefined): moment.Duration | undefined
    #toMomentDuration(duration: Temporal.Duration | undefined): moment.Duration | undefined {
        if (duration === undefined)
            return undefined;
        return moment.duration({
            years: duration.years,
            months: duration.months,
            weeks: duration.weeks,
            days: duration.days,
            hours: duration.hours,
            minutes: duration.minutes,
            seconds: duration.seconds,
            // moment has no microsecond or nanosecond fields, but it stores milliseconds as a float
            milliseconds: duration.milliseconds + (duration.microseconds * 1e3 + duration.nanoseconds) / 1e6
        });
    }

    #handleError(error: unknown): { success: false; reason?: string; } {
        if (error instanceof Eris.DiscordHTTPError || error instanceof Eris.DiscordRESTError)
            return { success: false, reason: error.message };

        if (!(error instanceof Error)) {
            const e = error = new Error(String(error));
            Error.captureStackTrace(e, this.#handleError);
        }
        this.#cluster.logger.error(error);
        return { success: false };
    }

    #createVariablesProvider(): VariablesProvider {
        return new VariablesProvider(
            createTagVariableScopeFactory(
                {
                    get: (scope, name) => this.#cluster.database.tagVariables.get(name, scope),
                    upsert: (scope, entries) => this.#cluster.database.tagVariables.upsert(entries, scope)
                },
                [
                    {
                        name: templates.subtag.variables.server.name,
                        prefix: '_',
                        description: templates.subtag.variables.server.description,
                        bind: ctx => ({
                            type: ctx.root.tagVars ? TagVariableType.GUILD_TAG : TagVariableType.GUILD_CC,
                            guildId: ctx.root.guildId
                        })
                    },
                    {
                        name: templates.subtag.variables.author.name,
                        prefix: '@',
                        description: templates.subtag.variables.author.description,
                        bind: ctx => ctx.root.authorId === undefined
                            ? { type: TagVariableType.TEMP, id: randomUUID() }
                            : { type: TagVariableType.AUTHOR, authorId: ctx.root.authorId }
                    },
                    {
                        name: templates.subtag.variables.global.name,
                        prefix: '*',
                        description: templates.subtag.variables.global.description,
                        bind: () => ({ type: TagVariableType.GLOBAL })
                    },
                    {
                        name: templates.subtag.variables.temporary.name,
                        prefix: '~',
                        description: templates.subtag.variables.temporary.description,
                        bind: () => ({ type: TagVariableType.TEMP, id: randomUUID() })
                    },
                    {
                        name: templates.subtag.variables.local.name,
                        prefix: '',
                        description: templates.subtag.variables.local.description,
                        bind: ctx => !ctx.root.tagVars
                            ? { type: TagVariableType.LOCAL_CC, guildId: ctx.root.guildId, name: ctx.root.tagName }
                            : { type: TagVariableType.LOCAL_TAG, name: ctx.root.tagName }
                    }
                ]
            ),
            context => {
                const metadata = this.#metadata.get(context)!;
                const logger = this.#cluster.logger;
                return {
                    commitStarted() {
                        const execRunning = metadata.execTimer.running;
                        if (execRunning)
                            metadata.execTimer.end();
                        metadata.dbTimer.resume();
                        return {
                            [Symbol.dispose]: memoize(() => {
                                metadata.dbTimer.end();
                                if (execRunning)
                                    metadata.execTimer.resume();
                            })
                        };
                    },
                    commitBatch(size, scope) {
                        logger.bbtag('Committing', size, 'objects to the', scope.prefix, 'pool.');
                        const start = performance.now();
                        return {
                            [Symbol.dispose]: memoize(() => {
                                metadata.dbCommitted += size;
                                const elapsed = performance.now() - start;
                                logger[elapsed > 3000 ? 'info' : 'bbtag']('Commited', size, 'objects to the', scope.prefix, 'pool in', elapsed, 'ms.');
                            })
                        };
                    },
                    getFailed(error, varName, scope) {
                        logger.error(error, { varName, scope: scope.scope });
                    }
                };
            }
        );
    }
}

function toErisEmbed({ timestamp, ...e }: Embed): Eris.EmbedOptions {
    if (timestamp === undefined)
        return e;
    return {
        ...e,
        timestamp: timestamp.toString()
    };
}
function fromErisEmbed({ timestamp, ...e }: Eris.Embed): Embed {
    if (timestamp === undefined)
        return e;
    if (typeof timestamp !== 'string')
        timestamp = timestamp.toISOString();
    return {
        ...e,
        timestamp: Temporal.Instant.from(timestamp)
    };
}
function* getSubtagCalls(statement: BBTagExpression): IterableIterator<SubtagCall> {
    for (const part of statement.values) {
        if (typeof part === 'string')
            continue;

        yield part;
        yield* getSubtagCalls(part.name);
        for (const arg of part.args)
            yield* getSubtagCalls(arg);
    }
}

class TagCooldownError extends BBTagRuntimeError {
    public constructor(public readonly tagName: string, public readonly isCC: boolean, public readonly remaining: Temporal.Duration) {
        super(`Cooldown: ${remaining.total({ unit: 'milliseconds', relativeTo: Temporal.Now.zonedDateTimeISO() })}`, `${isCC ? 'Custom command' : 'Tag'} ${tagName}`);
    }
}

type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type ValueOfUnion<T, K extends PropertyKey> =
    T extends unknown ? K extends keyof T ? T[K] : never : never;

export interface BBTagSerializedContextV4 {
    msg: {
        id: string;
        timestamp: number;
        content: string;
        channel: { id: string; serialized: string; };
        member?: { id: string; serialized: string; };
        attachments: object[];
        embeds: Embed[];
    };
    isCC: boolean;
    scope: {
        quiet?: boolean;
        fallback?: string;
        noLookupErrors?: boolean;
        reason?: string;
        inLock: boolean;
        paramsarray?: string[];
        reaction?: string;
        reactUser?: string;
        functions: Record<string, BBTagExpression>;
        isTag: boolean;
    };
    inputRaw: string;
    flags: ReadonlyArray<Pick<FlagDefinition<unknown>, 'word' | 'flag'>>;
    data: {
        query: {
            count: number;
            user: Record<string, string>;
            role: Record<string, string>;
            channel: Record<string, string>;
        };
        ownedMsgs: string[];
        allowedMentions: {
            users: string[];
            roles: string[];
            everybody: boolean;
        };
        stackSize: number;
    };
    tagName: string;
    rootTagName: string;
    author: string | undefined;
    authorizer: string | undefined;
    prefix: string | undefined;
    tagVars: boolean;
    tempVars: Record<string, JToken>;
    limit: SerializedRuntimeLimit;
}

function readableSubtag(subtag: SubtagCall | undefined): JObject | undefined {
    return subtag === undefined ? undefined : {
        name: bbtag.stringify(subtag.name),
        arguments: subtag.args.map(bbtag.stringify),
        ...subtagLocation(subtag)
    };
}

function subtagLocation(subtag: SubtagCall): JObject {
    return {
        start: `Index ${subtag.start.index}: Line ${subtag.start.line}, column ${subtag.start.column}`,
        end: `Index ${subtag.end.index}: Line ${subtag.end.line}, column ${subtag.end.column}`
    };
}
