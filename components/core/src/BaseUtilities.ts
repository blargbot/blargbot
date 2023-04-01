import type { Configuration } from '@blargbot/config/Configuration.js';
import type { FormatEmbedAuthor, SendContent, SendContext } from '@blargbot/core/types.js';
import { CrowdinTranslationSource } from '@blargbot/crowdin';
import type { Database } from '@blargbot/database';
import type { Emote } from '@blargbot/discord-emote';
import type Discord from '@blargbot/discord-types';
import { checkEmbedSize, checkMessageSize, isGuildChannel, isPrivateChannel, isTextableChannel, isVoiceChannel, markup } from '@blargbot/discord-util';
import type { DiscordChannelTag, DiscordRoleTag, DiscordTagSet, DiscordUserTag, StoredUser } from '@blargbot/domain/models/index.js';
import type { IFormattable, IFormatter } from '@blargbot/formatting';
import { format, Formatter, TranslationMiddleware, util } from '@blargbot/formatting';
import { hasProperty, hasValue } from '@blargbot/guards';
import type { Logger } from '@blargbot/logger';
import type { Snowflake } from '@blargbot/snowflakes';
import snowflake from '@blargbot/snowflakes';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import type { BaseClient } from './BaseClient.js';
import { metrics } from './Metrics.js';
import templates from './text.js';
import { guard, humanize } from './utils/index.js';

export class BaseUtilities {
    readonly #translator: TranslationMiddleware;
    public get user(): Eris.ExtendedUser { return this.client.discord.user; }
    public get discord(): Eris.Client { return this.client.discord; }
    public get database(): Database { return this.client.database; }
    public get logger(): Logger { return this.client.logger; }
    public get config(): Configuration { return this.client.config; }
    public readonly translator: CrowdinTranslationSource;

    public constructor(
        public readonly client: BaseClient
    ) {
        this.translator = new CrowdinTranslationSource('a713aad8fe135bf923f9587yoka');
        this.#translator = new TranslationMiddleware(this.translator, client.logger.error.bind(client.logger));

        client.discord.on('guildBanAdd', (guild, user) => {
            const bans = this.getGuildBans(guild);
            bans.add(user.id);
        });
        client.discord.on('guildBanRemove', (guild, user) => {
            const bans = this.getGuildBans(guild);
            bans.delete(user.id);
        });
    }

    async #getSendChannel(context: SendContext): Promise<Eris.TextableChannel> {
        if (typeof context === 'string') {
            const channel = await this.getChannel(context);
            if (channel === undefined)
                throw new Error('Channel not found');
            if (isTextableChannel(channel) && !isVoiceChannel(channel))
                return channel;
            throw new Error('Channel is not textable');
        }
        if (context instanceof Eris.User) {
            return await context.getDMChannel();
        }
        return context;
    }

    public async getFormatter(target?: Eris.Channel | Eris.Guild | string): Promise<IFormatter> {
        const guildId = typeof target === 'object' ? target instanceof Eris.Guild ? target.id : target instanceof Eris.GuildChannel ? target.guild.id : undefined : target;
        const localeStr = guildId === undefined ? undefined : await this.database.guilds.getSetting(guildId, 'language');
        return new Formatter(
            new Intl.Locale(localeStr ?? 'en'),
            [this.#translator],
            this.client.formatCompiler
        );
    }

    public websiteLink(path?: string): URL {
        path = path?.replace(/^[/\\]+/, '');
        const scheme = this.config.website.secure ? 'https' : 'http';
        const host = this.config.website.host;
        const port = this.config.website.port === 80 ? '' : `:${this.config.website.port}`;
        return new URL(`${scheme}://${host}${port}/${path ?? ''}`);
    }

    public embedifyAuthor(target: Eris.Member | Eris.User | Eris.Guild | StoredUser, includeId = false): FormatEmbedAuthor<IFormattable<string>> {
        if (target instanceof Eris.User) {
            return {
                icon_url: target.avatarURL,
                name: util.literal(`${target.username}#${target.discriminator} ${includeId ? `(${target.id})` : ''}`)
                // url: target === this.discord.user ? undefined : `https://discord.com/users/${target.id}`
            };
        } else if (target instanceof Eris.Member) {
            return {
                icon_url: target.avatarURL,
                name: util.literal(`${target.nick ?? target.username} ${includeId ? `(${target.id})` : ''}`)
                // url: `https://discord.com/users/${target.id}`
            };
        } else if (target instanceof Eris.Guild) {
            return {
                icon_url: target.iconURL ?? undefined,
                name: util.literal(target.name)
            };
        } else if ('userid' in target) {
            return {
                icon_url: target.avatarURL,
                name: util.literal(`${target.username ?? 'UNKNOWN'} ${includeId ? `(${target.userid})` : ''}`)
                // url: `https://discord.com/users/${target.userid}`
            };
        }

        return target; // never
    }

    public async reply<T extends Eris.Textable & Eris.Channel>(message: Eris.Message<T>, payload: IFormattable<SendContent<string>>, author?: Eris.User): Promise<Eris.Message<T> | undefined> {
        return await this.send(message.channel, {
            [format](formatter) {
                return {
                    messageReference: {
                        messageID: message.id,
                        channelID: message.channel.id,
                        failIfNotExists: false
                    },
                    ...payload[format](formatter)
                };
            }
        }, author);
    }

    public async send<T extends Eris.Textable & Eris.Channel>(context: T, payload: IFormattable<SendContent<string>>, author?: Eris.User): Promise<Eris.Message<T> | undefined>;
    public async send(context: SendContext, payload: IFormattable<SendContent<string>>, author?: Eris.User): Promise<Eris.Message | undefined>;
    public async send(context: SendContext, payload: IFormattable<SendContent<string>>, author?: Eris.User): Promise<Eris.Message | undefined> {
        metrics.sendCounter.inc();

        const channel = await this.#getSendChannel(context);
        const formatter = await this.getFormatter(channel);
        const { file: files = [], ...content } = payload[format](formatter);

        // Stringifies embeds if we lack permissions to send embeds
        if (content.embeds !== undefined && isGuildChannel(channel)) {
            const member = await this.getMember(channel.guild, this.user.id);
            if (member !== undefined && channel.permissionsOf(member).has('embedLinks') !== true) {
                content.content = `${content.content ?? ''}${humanize.embed(content.embeds)}`;
                delete content.embeds;
            }
        }

        content.content = content.content?.trim();
        if (content.content?.length === 0)
            content.content = undefined;

        if (content.content === undefined
            && (content.embeds?.length ?? 0) === 0
            && files.length === 0
            && (content.components?.length ?? 0) === 0) {
            throw new Error('No content');
        }

        if (!checkEmbedSize(content.embeds)) {
            const id = await this.generateDumpPage(content, channel);
            const output = this.websiteLink(`/dumps/${id}`).toString();
            content.content = `Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n\nTo see what I would have said, please visit ${output}`;
            if (content.embeds !== undefined)
                delete content.embeds;
        } else if (content.content !== undefined && !checkMessageSize(content.content)) {
            files.unshift({
                file: content.content,
                name: 'message.txt'
            });
            content.content = undefined;
        }
        for (const file of files)
            if (typeof file === 'object' && 'attachment' in file && typeof file.file === 'string')
                file.file = Buffer.from(file.file);

        this.logger.debug('Sending content: ', JSON.stringify(payload));
        try {
            return await channel.createMessage(content, files);
        } catch (error: unknown) {
            if (!(error instanceof Eris.DiscordRESTError))
                throw error;

            const code = error.code;
            if (!hasProperty(sendErrors, code))
                return undefined;

            const result = sendErrors[code](this, channel, content, error);
            if (typeof result === 'object' && author !== undefined && await this.canDmErrors(author.id)) {
                await this.send(author, {
                    [format](formatter) {
                        return {
                            content: isGuildChannel(channel)
                                ? templates.utils.send.errors.guild({ channel, message: result })[format](formatter)
                                : templates.utils.send.errors.dm({ channel, message: result })[format](formatter),
                            messageReference: content.messageReference
                        };
                    }
                });
            }
            return undefined;
        }
    }

    public async addReactions(context: { id: string; channel: { id: string; }; }, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
        const results = { success: [] as Emote[], failed: [] as Emote[] };
        const reacted = new Set<string>();
        let done = false;
        for (const reaction of reactions) {
            const api = reaction.toApi();
            if (reacted.size === reacted.add(api).size)
                continue;

            if (done) {
                results.failed.push(reaction);
                continue;
            }

            try {
                await this.discord.addMessageReaction(context.channel.id, context.id, api);
                results.success.push(reaction);
            } catch (e: unknown) {
                if (e instanceof Eris.DiscordRESTError) {
                    switch (e.code) {
                        case Eris.ApiError.MAXIMUM_REACTIONS:
                        case Eris.ApiError.MISSING_PERMISSIONS:
                            done = true;
                        //fallthrough
                        case Eris.ApiError.REACTION_BLOCKED:
                        case Eris.ApiError.UNKNOWN_EMOJI:
                            results.failed.push(reaction);
                            continue;
                    }
                }
                throw e;
            }
        }

        return results;
    }

    public async resolveTags(message: string, context?: string | Eris.KnownChannel): Promise<string> {
        const guildId = typeof context === 'object' ? isGuildChannel(context) ? context.guild.id : undefined : context;
        const tags = await this.discoverMessageEntities({ guildId, content: message });

        return message.replaceAll(markup.user.pattern.anywhere, v => {
            const user = tags.parsedUsers[markup.user.parse(v)];
            if (user.username === undefined)
                return '@UNKNOWN USER';
            return `@${user.username}#${user.discriminator}`;
        }).replaceAll(markup.user.nickname.pattern.anywhere, v => {
            const user = tags.parsedUsers[markup.user.nickname.parse(v)];
            if (user.username === undefined)
                return '@UNKNOWN USER';
            return `@${user.username}#${user.discriminator}`;
        }).replaceAll(markup.role.pattern.anywhere, v => {
            const role = tags.parsedRoles[markup.role.parse(v)];
            if (role.name === undefined)
                return '@UNKNOWN ROLE';
            return `@${role.name}`;
        }).replaceAll(markup.channel.pattern.anywhere, v => {
            const channel = tags.parsedChannels[markup.channel.parse(v)];
            if (channel.name === undefined)
                return '#UNKNOWN CHANNEL';
            return `#${channel.name}`;
        }).replaceAll(markup.customEmoji.pattern.anywhere, v => {
            const emoji = markup.customEmoji.parse(v);
            return emoji.name;
        }).replaceAll(markup.timestamp.pattern.anywhere, v => {
            const timestamp = markup.timestamp.parse(v);
            switch (timestamp.style) {
                case 't': return moment(timestamp.timeMs).format('HH:mm');
                case 'T': return moment(timestamp.timeMs).format('HH:mm:ss');
                case 'd': return moment(timestamp.timeMs).format('DD/MM/yyyy');
                case 'D': return moment(timestamp.timeMs).format('DD MMMM yyyy');
                case 'F': return moment(timestamp.timeMs).format('dddd, DD MMMM yyyy HH:mm');
                case undefined:
                case 'f': return moment(timestamp.timeMs).format('DD MMMM yyyy HH:mm');
                case 'R': return moment.duration(moment(timestamp.timeMs).diff(moment())).humanize(true);
            }
        });
    }

    public async discoverMessageEntities(message: { guildId?: string; content?: string; embeds?: Discord.APIEmbed[]; }): Promise<DiscordTagSet> {
        return await this.discoverMessagesEntities([message]);
    }

    public async discoverMessagesEntities(messages: Iterable<{ guildId?: string; content?: string; embeds?: Discord.APIEmbed[]; }>): Promise<DiscordTagSet> {
        const parsedChannels = new Map<string, Promise<DiscordChannelTag>>();
        const parsedRoles = new Map<string, Promise<DiscordUserTag>>();
        const parsedUsers = new Map<string, Promise<DiscordRoleTag>>();

        for (const { guildId, ...message } of messages) {
            for (const content of this.#getMessageMarkdownContent(message)) {
                for (const roleId of markup.user.findAll(content))
                    ensure(parsedRoles, roleId, () => this.#getDiscordRoleTag(roleId, guildId));
                for (const userId of markup.user.findAll(content))
                    ensure(parsedUsers, userId, () => this.#getDiscordUserTag(userId));
                for (const channelId of markup.channel.findAll(content))
                    ensure(parsedChannels, channelId, () => this.#getDiscordChannelTag(channelId));
            }
        }

        const parsedChannelsResults = Promise.all([...parsedChannels].map(async e => [e[0], await e[1]] as const));
        const parsedRolesResults = Promise.all([...parsedRoles].map(async e => [e[0], await e[1]] as const));
        const parsedUsersResults = Promise.all([...parsedUsers].map(async e => [e[0], await e[1]] as const));

        return {
            parsedChannels: Object.fromEntries(await parsedChannelsResults),
            parsedRoles: Object.fromEntries(await parsedRolesResults),
            parsedUsers: Object.fromEntries(await parsedUsersResults)
        };
    }

    * #getMessageMarkdownContent(message: { content?: string; embeds?: Discord.APIEmbed[]; }): Generator<string> {
        if (message.content !== undefined)
            yield message.content;
        if (message.embeds !== undefined) {
            for (const embed of message.embeds) {
                if (embed.title !== undefined)
                    yield embed.title;
                if (embed.description !== undefined)
                    yield embed.description;
                if (embed.fields !== undefined) {
                    for (const field of embed.fields) {
                        yield field.name;
                        yield field.value;
                    }
                }
            }
        }
    }

    async #getDiscordRoleTag(id: string, guildId?: string): Promise<DiscordRoleTag> {
        const role = guildId === undefined ? undefined : await this.getRole(guildId, id);
        return {
            id: id,
            color: role?.color,
            name: role?.name
        };
    }

    async #getDiscordChannelTag(id: string): Promise<DiscordChannelTag> {
        const channel = await this.getChannel(id);
        return {
            id,
            name: channel === undefined ? undefined : 'name' in channel ? channel.name : undefined,
            type: channel?.type
        };
    }

    async #getDiscordUserTag(userId: string): Promise<DiscordUserTag> {
        const dbUser = await this.database.users.get(userId);
        if (dbUser?.username !== undefined && dbUser.discriminator !== undefined) {
            return {
                id: userId,
                avatarURL: dbUser.avatarURL,
                discriminator: dbUser.discriminator,
                username: dbUser.username
            };
        }

        const apiUser = await this.getUser(userId);
        if (apiUser !== undefined) {
            return {
                id: userId,
                avatarURL: apiUser.avatarURL,
                discriminator: apiUser.discriminator,
                username: apiUser.username
            };
        }

        return { id: userId };
    }

    public async generateDumpPage(payload: Eris.AdvancedMessageContent, channel: Eris.Channel): Promise<Snowflake> {
        const id = snowflake.fromTime();
        await this.database.dumps.add({
            id: id,
            content: payload.content ?? undefined,
            embeds: payload.embeds,
            channelid: channel.id as Snowflake,
            expiry: 604800
        });
        return id;
    }

    public async canDmErrors(userId: string): Promise<boolean> {
        const storedUser = await this.database.users.get(userId);
        return storedUser?.dontdmerrors !== true;
    }

    public isBotOwner(userId: string): boolean {
        for (const owner of this.client.ownerIds)
            if (owner === userId)
                return true;
        return false;
    }

    public isBotDeveloper(userId: string): boolean {
        return this.isBotOwner(userId)
            || this.config.discord.users.developers.includes(userId);
    }
    public isBotStaff(userId: string): Promise<boolean> | boolean;
    public async isBotStaff(userId: string): Promise<boolean> {
        if (this.isBotDeveloper(userId))
            return true;
        const police = await this.database.vars.get('police');
        return police?.value.includes(userId) ?? false;
    }

    public isBotSupport(userId: string): Promise<boolean> | boolean;
    public async isBotSupport(userId: string): Promise<boolean> {
        if (await this.isBotStaff(userId))
            return true;
        const support = await this.database.vars.get('support');
        return support?.value.includes(userId) ?? false;
    }

    public async getChannel(channelId: string): Promise<Eris.KnownChannel | undefined>;
    public async getChannel(guild: string | Eris.Guild, channelId: string): Promise<Eris.KnownGuildChannel | undefined>;
    public async getChannel(...args: [string] | [string | Eris.Guild, string]): Promise<Eris.KnownChannel | undefined> {
        const [guildVal, channelVal] = args.length === 2 ? args : [undefined, args[0]] as const;

        const channelId = markup.channel.tryParse(channelVal) ?? channelVal;
        if (!snowflake.test(channelId))
            return undefined;

        if (guildVal === undefined)
            return this.discord.getChannel(channelId) ?? await this.#getRestChannel(channelId);
        const guild = typeof guildVal === 'string' ? await this.getGuild(guildVal) : guildVal;
        if (guild === undefined)
            return undefined;
        const channel = guild.channels.get(channelId) ?? await this.#getRestChannel(channelId);
        return channel !== undefined && isGuildChannel(channel) ? channel : undefined;
    }

    async #getRestChannel(channelId: string): Promise<Eris.KnownChannel | undefined> {
        try {
            const channel = await this.discord.getRESTChannel(channelId);
            if (isPrivateChannel(channel)) {
                if (this.discord.privateChannels.get(channel.id) !== channel)
                    this.discord.privateChannels.set(channel.id, channel);
            } else {
                if (guard.isUncached(channel.guild)) {
                    channel.guild = await this.getGuild(channel.guild.id) ?? channel.guild;
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    channel.guild.channels ??= new Eris.Collection(Eris.GuildChannel as new (...args: unknown[]) => Eris.AnyGuildChannel);
                }
                if (channel.guild.channels.get(channel.id) !== channel)
                    channel.guild.channels.set(channel.id, channel);
            }
            return channel;
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.UNKNOWN_CHANNEL)
                return undefined;
            throw err;
        }
    }

    public async findChannels(guild: string | Eris.Guild, query?: string): Promise<Eris.KnownGuildChannel[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        const allChannels = [...guild.channels.values(), ...guild.threads.values()];
        if (query === undefined)
            return allChannels;

        const channel = await this.getChannel(guild, query);
        if (channel !== undefined && isGuildChannel(channel) && channel.guild.id === guild.id)
            return [channel];

        return findBest(allChannels, (c) => this.channelMatchScore(c, query));
    }

    public channelMatchScore(channel: Eris.KnownChannel, query: string): number {
        const normalizedQuery = query.toLowerCase();

        if (isGuildChannel(channel)) {
            if (!hasValue(channel.name))
                return 0;

            const normalizedName = channel.name.toLowerCase();
            if (channel.name === query) return Infinity;
            if (channel.name.startsWith(query)) return 1000;
            if (normalizedName.startsWith(normalizedQuery)) return 100;
            if (channel.name.includes(query)) return 10;
            if (normalizedName.includes(normalizedQuery)) return 1;
        } else if (isPrivateChannel(channel) && 'recipient' in channel) {
            return this.userMatchScore(channel.recipient, query);
        }
        return 0;

    }

    public async getUser(userId: string): Promise<Eris.User | undefined> {
        userId = markup.user.tryParse(userId) ?? userId;
        if (!snowflake.test(userId))
            return undefined;

        try {
            return this.discord.users.get(userId) ?? await this.discord.getRESTUser(userId);
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError) {
                switch (err.code) {
                    case Eris.ApiError.INVALID_FORM_BODY:
                        this.logger.error('Error while getting user', userId, err);
                    // fallthrough
                    case Eris.ApiError.MISSING_ACCESS:
                    case Eris.ApiError.UNKNOWN_USER:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async findUsers(guild: Eris.Guild | string, query?: string): Promise<Eris.User[]> {
        if (query !== undefined) {
            const user = await this.getUser(query);
            if (user !== undefined)
                return [user];
        }
        const members = await this.findMembers(guild, query);
        return members.map(m => m.user);
    }

    public async getGuild(guildId: string): Promise<Eris.Guild | undefined> {
        if (!snowflake.test(guildId))
            return undefined;

        try {
            return this.discord.guilds.get(guildId) ?? await this.discord.getRESTGuild(guildId);
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError) {
                switch (err.code) {
                    case Eris.ApiError.INVALID_FORM_BODY:
                        this.logger.error('Error while getting guild', guildId, err);
                    // fallthrough
                    case Eris.ApiError.MISSING_ACCESS:
                    case Eris.ApiError.UNKNOWN_GUILD:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMessage(channel: string, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined>;
    public async getMessage(channel: Eris.KnownChannel, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined>;
    public async getMessage(channel: string | Eris.KnownChannel, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined> {
        if (!snowflake.test(messageId))
            return undefined;

        const foundChannel = typeof channel === 'string' ? await this.getChannel(channel) : channel;

        if (foundChannel === undefined || !isTextableChannel(foundChannel) || isVoiceChannel(foundChannel))
            return undefined;

        try {
            if (force === true)
                return await foundChannel.getMessage(messageId);
            return foundChannel.messages.get(messageId) ?? await foundChannel.getMessage(messageId);
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError) {
                switch (err.code) {
                    case Eris.ApiError.INVALID_FORM_BODY:
                        this.logger.error('Error while getting message', messageId, 'in channel', foundChannel.id, err);
                    // fallthrough
                    case Eris.ApiError.MISSING_ACCESS:
                    case Eris.ApiError.UNKNOWN_MESSAGE:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMember(guild: string | Eris.Guild, userId: string): Promise<Eris.Member | undefined> {
        userId = markup.user.tryParse(userId) ?? userId;
        if (!snowflake.test(userId))
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        try {
            return guild.members.get(userId) ?? await guild.getRESTMember(userId);
        } catch (error: unknown) {
            if (error instanceof Eris.DiscordRESTError) {
                switch (error.code) {
                    case Eris.ApiError.UNKNOWN_MEMBER:
                    case Eris.ApiError.UNKNOWN_USER:
                    case Eris.ApiError.MISSING_ACCESS:
                    case Eris.ApiError.INVALID_FORM_BODY:
                        return undefined;
                }
            }
            throw error;
        }
    }

    readonly #guildsWithResolvedMembers = new WeakMap<Eris.Guild, Promise<void>>();
    public ensureMemberCache(guild: Eris.Guild): Promise<void> {
        let resolve = this.#guildsWithResolvedMembers.get(guild);
        if (resolve === undefined) {
            this.#guildsWithResolvedMembers.set(guild, resolve = this.#ensureMemberCache(guild).catch(err => {
                if (err instanceof Eris.DiscordRESTError)
                    this.#guildsWithResolvedMembers.delete(guild);
                throw err;
            }));
        }
        return resolve;
    }

    async #ensureMemberCache(guild: Eris.Guild): Promise<void> {
        const initialSize = guild.members.size;
        await guild.fetchAllMembers();
        this.logger.info('Cached', guild.members.size - initialSize, 'members in guild', guild.id, '. Member cache now has', guild.members.size, 'entries');
    }

    public async * streamAllBans(guild: Eris.Guild): AsyncGenerator<Eris.GuildBan, void, undefined> {
        let batch = [];
        let after;
        const bans = this.getGuildBans(guild);
        do {
            batch = await guild.getBans({ after });
            for (const ban of batch)
                bans.add(ban.user.id);
            yield* batch;
            after = batch.pop()?.user.id;
        } while (after !== undefined);
    }

    public async requestAllBans(guild: Eris.Guild): Promise<Eris.GuildBan[]> {
        const result = [];
        for await (const ban of this.streamAllBans(guild))
            result.push(ban);
        return result;
    }

    readonly #guildsWithResolvedBans = new Map<string, Promise<void>>();
    public ensureGuildBans(guild: Eris.Guild): Promise<void> {
        const hasPerms = guild.members.get(this.user.id)?.permissions.has('banMembers') ?? false;
        if (!hasPerms)
            this.#guildsWithResolvedBans.delete(guild.id);
        let resolve = this.#guildsWithResolvedBans.get(guild.id);
        if (resolve === undefined) {
            this.#guildsWithResolvedBans.set(guild.id, resolve = this.#ensureGuildBans(guild).catch(err => {
                if (err instanceof Eris.DiscordRESTError)
                    this.#guildsWithResolvedBans.delete(guild.id);
                throw err;
            }));
        }
        return resolve;
    }

    async #ensureGuildBans(guild: Eris.Guild): Promise<void> {
        for await (const _ of this.streamAllBans(guild)) {
            // NO-OP - streamAllBans caches each record as it encounters them, which is all we need to do here.
        }
    }

    readonly #guildBanCache = new Map<string, Set<string>>();
    public getGuildBans(guild: Eris.Guild): Set<string> {
        let cache = this.#guildBanCache.get(guild.id);
        if (cache === undefined)
            this.#guildBanCache.set(guild.id, cache = new Set<string>());
        return cache;
    }

    public async findMembers(guild: string | Eris.Guild, query?: string): Promise<Eris.Member[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        if (query === undefined) {
            await this.ensureMemberCache(guild);
            return [...guild.members.values()];
        }

        const member = await this.getMember(guild, query);
        if (member !== undefined)
            return [member];

        await this.ensureMemberCache(guild);
        return findBest(guild.members.values(), m => this.memberMatchScore(m, query));
    }

    public async getWebhook(guild: string | Eris.Guild, webhookId: string): Promise<Eris.Webhook | undefined> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        try {
            const webhooks = await guild.getWebhooks();
            return webhooks.find(w => w.id === webhookId);
        } catch (error: unknown) {
            if (error instanceof Eris.DiscordRESTError) {
                switch (error.code) {
                    case Eris.ApiError.MISSING_PERMISSIONS:
                    case Eris.ApiError.MISSING_ACCESS:
                        return undefined;
                }
            }
            throw error;
        }
    }

    public async findWebhooks(guild: string | Eris.Guild, query?: string): Promise<Eris.Webhook[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        let webhooks: Eris.Webhook[];
        try {
            webhooks = await guild.getWebhooks();
        } catch (error: unknown) {
            if (error instanceof Eris.DiscordRESTError) {
                switch (error.code) {
                    case Eris.ApiError.MISSING_PERMISSIONS:
                    case Eris.ApiError.MISSING_ACCESS:
                        return [];
                }
            }
            throw error;
        }

        if (query === undefined)
            return webhooks;

        const byId = webhooks.find(w => w.id === query);
        if (byId !== undefined)
            return [byId];

        return findBest(webhooks, w => this.webhookMatchScore(w, query));
    }

    public async getSender(guild: string | Eris.Guild, senderId: string): Promise<Eris.Member | Eris.Webhook | undefined> {
        senderId = markup.user.tryParse(senderId) ?? senderId;
        if (!snowflake.test(senderId))
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return undefined;

        const member = await this.getMember(guild, senderId);
        if (member !== undefined)
            return member;

        return await this.getWebhook(guild, senderId);
    }

    public async findSenders(guild: string | Eris.Guild, query?: string): Promise<Array<Eris.Member | Eris.Webhook>> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        return (await Promise.all([
            this.findMembers(guild, query),
            this.findWebhooks(guild, query)
        ])).flat();
    }

    public memberMatchScore(member: Eris.Member, query: string): number {
        let score = this.userMatchScore(member.user, query);
        const displayName = member.nick ?? member.username;
        const normalizedDisplayname = displayName.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (`${member.username}#${member.discriminator}` === query) return Infinity;
        if (displayName.startsWith(query)) score += 100;
        if (normalizedDisplayname.startsWith(normalizedQuery)) score += 10;
        if (normalizedDisplayname.includes(normalizedQuery)) score += 1;
        return score;
    }

    public userMatchScore(user: Eris.User, query: string): number {
        let score = 0;
        const normalizedUsername = user.username.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (`${user.username}#${user.discriminator}` === query) return Infinity;
        if (user.username.startsWith(query)) score += 100;
        if (normalizedUsername.startsWith(normalizedQuery)) score += 10;
        if (normalizedUsername.includes(normalizedQuery)) score += 1;
        return score;
    }

    public webhookMatchScore(webhook: Eris.Webhook, query: string): number {
        let score = 0;
        const normalizedName = webhook.name.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (webhook.name === query) return Infinity;
        if (webhook.name.startsWith(query)) score += 100;
        if (normalizedName.startsWith(normalizedQuery)) score += 10;
        if (normalizedName.includes(normalizedQuery)) score += 1;
        return score;
    }

    public async getRole(guild: string | Eris.Guild, roleId: string): Promise<Eris.Role | undefined> {
        roleId = markup.role.tryParse(roleId) ?? roleId;
        if (!snowflake.test(roleId))
            return undefined;

        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;
        if (typeof guild === 'string')
            return undefined;

        try {
            return guild.roles.get(roleId);
        } catch (error: unknown) {
            if (error instanceof Eris.DiscordRESTError && error.code === Eris.ApiError.UNKNOWN_ROLE)
                return undefined;
            throw error;
        }
    }

    public async findRoles(guild: string | Eris.Guild, query?: string): Promise<Eris.Role[]> {
        if (typeof guild === 'string')
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === 'string')
            return [];

        if (query === undefined)
            return [...guild.roles.values()];

        const role = await this.getRole(guild, query);
        if (role !== undefined)
            return [role];

        return findBest(guild.roles.values(), r => this.roleMatchScore(r, query));
    }

    public roleMatchScore(role: Eris.Role, query: string): number {
        const normalizedQuery = query.toLowerCase();
        const normalizedName = role.name.toLowerCase();

        if (role.name === query) return Infinity;
        if (role.name.startsWith(query)) return 1000;
        if (normalizedName.startsWith(normalizedQuery)) return 100;
        if (role.name.includes(query)) return 10;
        if (normalizedName.includes(normalizedQuery)) return 1;
        return 0;
    }
}

const sendErrors = {
    [Eris.ApiError.UNKNOWN_CHANNEL]() {
        /* console.error('10003: Channel not found. ', channel); */
    },
    [Eris.ApiError.CANNOT_SEND_EMPTY_MESSAGE](util: BaseUtilities, _: unknown, payload: Eris.AdvancedMessageContent) {
        util.logger.error('50006: Tried to send an empty message:', payload);
    },
    [Eris.ApiError.CANNOT_MESSAGE_USER]() {
        /* console.error('50007: Can\'t send a message to this user!'); */
    },
    [Eris.ApiError.CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL]() {
        /* console.error('50008: Can\'t send messages in a voice channel!'); */
    },
    [Eris.ApiError.MISSING_PERMISSIONS](util: BaseUtilities) {
        util.logger.warn('50013: Tried sending a message, but had no permissions!');
        return templates.utils.send.errors.messageNoPerms;
    },
    [Eris.ApiError.MISSING_ACCESS](util: BaseUtilities) {
        util.logger.warn('50001: Missing Access');
        return templates.utils.send.errors.channelNoPerms;
    },
    [Eris.ApiError.EMBED_DISABLED](util: BaseUtilities) {
        util.logger.warn('50004: Tried embeding a link, but had no permissions!');
        return templates.utils.send.errors.embedNoPerms;
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    [Eris.ApiError.INVALID_FORM_BODY](util: BaseUtilities, channel: Eris.TextableChannel, payload: Eris.AdvancedMessageContent, error: Eris.DiscordRESTError) {
        util.logger.error(`${channel.id}|${isGuildChannel(channel) ? channel.name : 'PRIVATE CHANNEL'}|${JSON.stringify(payload)}`, error);
    }
} as const;

function findBest<T>(options: Iterable<T>, evaluator: (value: T) => number): T[] {
    const result = [];
    const matches = [];

    for (const option of options) {
        const score = evaluator(option);
        if (score === Infinity)
            matches.push(option);

        if (score > 0)
            result.push({ option, score });
    }

    if (matches.length === 1)
        return matches;

    return result.sort((a, b) => b.score - a.score)
        .map(r => r.option);
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const erisRequest = Eris.RequestHandler.prototype.request;
Eris.RequestHandler.prototype.request = function (...args) {
    try {
        let url;
        if (args[1].includes('webhook')) {
            url = '/webhooks';
        } else {
            url = args[1].replace(/reactions\/.+(\/|$)/g, 'reactions/_reaction/').replace(/\d+/g, '_id');
        }
        metrics.httpsRequests.labels(args[0], url).inc();
    } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    return erisRequest.call(this, ...args);
};

function ensure<Key, Value>(map: Map<Key, Value>, key: Key, factory: (key: Key) => Value): void {
    if (map.has(key))
        return;
    map.set(key, factory(key));
}
