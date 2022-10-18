import { Configuration } from '@blargbot/config/Configuration';
import { FormatEmbedAuthor, SendContent, SendContext } from '@blargbot/core/types';
import { Database } from '@blargbot/database';
import { TranslatableString } from '@blargbot/domain/messages/index';
import { IFormattable, IFormatter, literal } from '@blargbot/domain/messages/types';
import { DiscordChannelTag, DiscordRoleTag, DiscordTagSet, DiscordUserTag, StoredUser } from '@blargbot/domain/models';
import { Logger } from '@blargbot/logger';
import { Snowflake } from 'catflake';
import { AdvancedMessageContent, AnyGuildChannel, ApiError, Channel, ChannelInteraction, Client as Discord, Collection, DiscordRESTError, ExtendedUser, Guild, GuildChannel, KnownChannel, KnownGuildChannel, KnownMessage, Member, Message, RequestHandler, Role, TextableChannel, User, UserChannelInteraction, Webhook } from 'eris';
import moment from 'moment-timezone';

import { BaseClient } from './BaseClient';
import { Emote } from './Emote';
import { DefaultFormatter, FormatStringCompiler } from "./formatting";
import { metrics } from './Metrics';
import { guard, humanize, parse, snowflake } from './utils';

const compiler = new FormatStringCompiler();

export class BaseUtilities {
    public get user(): ExtendedUser { return this.client.discord.user; }
    public get discord(): Discord { return this.client.discord; }
    public get database(): Database { return this.client.database; }
    public get logger(): Logger { return this.client.logger; }
    public get config(): Configuration { return this.client.config; }

    public constructor(
        public readonly client: BaseClient
    ) {
    }

    async #getSendChannel(context: SendContext): Promise<TextableChannel> {
        if (typeof context === `string`) {
            const channel = await this.getChannel(context);
            if (channel === undefined)
                throw new Error(`Channel not found`);
            if (guard.isTextableChannel(channel))
                return channel;
            throw new Error(`Channel is not textable`);
        }
        if (context instanceof User) {
            return await context.getDMChannel();
        }
        return context;
    }

    public getFormatter(target?: Channel | Guild | string): Promise<IFormatter> {
        target;
        return Promise.resolve(new DefaultFormatter(new Intl.Locale(`en-GB`), compiler, {}));
    }

    public websiteLink(path?: string): string {
        path = path?.replace(/^[/\\]+/, ``);
        const scheme = this.config.website.secure ? `https` : `http`;
        const host = this.config.website.host;
        const port = this.config.website.port === 80 ? `` : `:${this.config.website.port}`;
        return `${scheme}://${host}${port}/${path ?? ``}`;
    }

    public embedifyAuthor(target: Member | User | Guild | StoredUser, includeId = false): FormatEmbedAuthor<IFormattable<string>> {
        if (target instanceof User) {
            return {
                icon_url: target.avatarURL,
                name: literal(`${humanize.fullName(target)} ${includeId ? `(${target.id})` : ``}`)
                // url: target === this.discord.user ? undefined : `https://discord.com/users/${target.id}`
            };
        } else if (target instanceof Member) {
            return {
                icon_url: target.avatarURL,
                name: literal(`${target.nick ?? target.username} ${includeId ? `(${target.id})` : ``}`)
                // url: `https://discord.com/users/${target.id}`
            };
        } else if (target instanceof Guild) {
            return {
                icon_url: target.iconURL ?? undefined,
                name: literal(target.name)
            };
        } else if (`userid` in target) {
            return {
                icon_url: target.avatarURL,
                name: literal(`${target.username ?? `UNKNOWN`} ${includeId ? `(${target.userid})` : ``}`)
                // url: `https://discord.com/users/${target.userid}`
            };
        }

        return target; // never
    }

    public async reply<T extends TextableChannel>(message: Message<T>, payload: IFormattable<SendContent<string>>, author?: User): Promise<Message<T> | undefined> {
        return await this.send(message.channel, {
            format(formatter) {
                return {
                    messageReference: {
                        messageID: message.id,
                        channelID: message.channel.id,
                        failIfNotExists: false
                    },
                    ...payload.format(formatter)
                };
            }
        }, author);
    }

    public async send<T extends TextableChannel>(context: T, payload: IFormattable<SendContent<string>>, author?: User): Promise<Message<T> | undefined>;
    public async send(context: SendContext, payload: IFormattable<SendContent<string>>, author?: User): Promise<Message | undefined>;
    public async send(context: SendContext, payload: IFormattable<SendContent<string>>, author?: User): Promise<Message | undefined> {
        metrics.sendCounter.inc();

        const channel = await this.#getSendChannel(context);
        const formatter = await this.getFormatter(channel);
        const { files = [], ...content } = payload.format(formatter);

        // Stringifies embeds if we lack permissions to send embeds
        if (content.embeds !== undefined && guard.isGuildChannel(channel)) {
            const member = await this.getMember(channel.guild, this.user.id);
            if (member !== undefined && channel.permissionsOf(member).has(`embedLinks`) !== true) {
                content.content = `${content.content ?? ``}${humanize.embed(content.embeds)}`;
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
            throw new Error(`No content`);
        }

        if (!guard.checkEmbedSize(content.embeds)) {
            const id = await this.generateDumpPage(content, channel);
            const output = this.websiteLink(`/dumps/${id}`);
            content.content = `Oops! I tried to send a message that was too long. If you think this is a bug, please report it!\n\nTo see what I would have said, please visit ${output}`;
            if (content.embeds !== undefined)
                delete content.embeds;
        } else if (content.content !== undefined && !guard.checkMessageSize(content.content)) {
            files.unshift({
                file: content.content,
                name: `message.txt`
            });
            content.content = undefined;
        }
        for (const file of files)
            if (typeof file === `object` && `attachment` in file && typeof file.file === `string`)
                file.file = Buffer.from(file.file);

        this.logger.debug(`Sending content: `, JSON.stringify(payload));
        try {
            return await channel.createMessage(content, files);
        } catch (error: unknown) {
            if (!(error instanceof DiscordRESTError))
                throw error;

            const code = error.code;
            if (!guard.hasProperty(sendErrors, code))
                return undefined;

            const result = sendErrors[code](this, channel, content, error);
            if (typeof result === `object` && author !== undefined && await this.canDmErrors(author.id)) {
                await this.send(author, {
                    format(formatter) {
                        return {
                            content: guard.isGuildChannel(channel)
                                ? sendErrorGuild({ channel, message: result }).format(formatter)
                                : sendErrorDm({ channel, message: result }).format(formatter),
                            messageReference: content.messageReference
                        };
                    }
                });
            }
            return undefined;
        }
    }

    public async addReactions(context: Message, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
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
                await context.addReaction(api);
                results.success.push(reaction);
            } catch (e: unknown) {
                if (e instanceof DiscordRESTError) {
                    switch (e.code) {
                        case ApiError.MAXIMUM_REACTIONS:
                        case ApiError.MISSING_PERMISSIONS:
                            done = true;
                        //fallthrough
                        case ApiError.REACTION_BLOCKED:
                        case ApiError.UNKNOWN_EMOJI:
                            results.failed.push(reaction);
                            continue;
                    }
                }
                throw e;
            }
        }

        return results;
    }

    public async resolveTags(context: ChannelInteraction | UserChannelInteraction | KnownChannel, message: string): Promise<string> {
        const regex = /<[^<>\s]+>/g;
        const promiseMap: { [tag: string]: Promise<string>; } = {};
        let match;
        while ((match = regex.exec(message)) !== null) {
            promiseMap[match[0]] ??= this.resolveTag(`channel` in context ? context.channel : context, match[0]);
        }
        const replacements = Object.fromEntries(await Promise.all(Object.entries(promiseMap).map(async e => [e[0], await e[1]] as const)));
        return message.replace(regex, match => replacements[match]);
    }

    public async loadDiscordTagData(content: string, guildId: string, cache: DiscordTagSet): Promise<void> {
        for (const match of content.matchAll(/<[^<>\s]+>/g)) {
            let id = parse.entityId(match[0], `@&`);
            if (id !== undefined) {
                cache.parsedRoles[id] ??= await this.#getDiscordRoleTag(guildId, id);
                continue;
            }
            id = parse.entityId(match[0], `@!`) ?? parse.entityId(match[0], `@`);
            if (id !== undefined) {
                cache.parsedUsers[id] ??= await this.#getDiscordUserTag(id);
                continue;
            }
            id = parse.entityId(match[0], `#`);
            if (id !== undefined)
                cache.parsedChannels[id] ??= await this.#getDiscordChannelTag(id);
        }
    }

    async #getDiscordRoleTag(guildId: string, id: string): Promise<DiscordRoleTag> {
        const role = await this.getRole(guildId, id);
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
            name: channel === undefined ? undefined : `name` in channel ? channel.name : undefined,
            type: channel?.type
        };
    }

    async #getDiscordUserTag(userId: string): Promise<DiscordUserTag> {
        const dbUser = await this.database.users.get(userId);
        if (dbUser !== undefined) {
            return {
                id: userId,
                avatarURL: dbUser.avatarURL,
                discriminator: dbUser.discriminator,
                username: dbUser.username
            };
        }

        const apiUser = await this.getUser(userId);
        return {
            id: userId,
            avatarURL: apiUser?.avatarURL,
            discriminator: apiUser?.discriminator,
            username: apiUser?.username
        };
    }

    public async resolveTag(context: KnownChannel, tag: string): Promise<string> {
        let id = parse.entityId(tag, `@&`);
        if (id !== undefined) { // ROLE
            const role = guard.isGuildChannel(context)
                ? await this.getRole(context.guild, id)
                : undefined;

            return `@${role?.name ?? `UNKNOWN ROLE`}`;
        }
        id = parse.entityId(tag, `@!`);
        if (id !== undefined) { // USER (NICKNAME)
            if (guard.isGuildChannel(context)) {
                const member = await this.getMember(context.guild, tag.substring(2));
                if (member !== undefined)
                    return member.nick ?? member.username;
            }
            const user = await this.getUser(id);
            return user === undefined ? `UNKNOWN USER` : `${user.username}#${user.discriminator}`;
        }
        id = parse.entityId(tag, `@`);
        if (id !== undefined) { // USER
            const user = await this.getUser(id);
            return user === undefined ? `UNKNOWN USER` : `${user.username}#${user.discriminator}`;
        }
        id = parse.entityId(tag, `#`);
        if (id !== undefined) { // CHANNEL
            const channel = await this.getChannel(id);
            return channel !== undefined && guard.isGuildChannel(channel) ? `#${channel.name}` : ``;
        }
        if (tag.startsWith(`<t:`)) { // TIMESTAMP
            const [, val, format = `f`] = tag.split(`:`);
            const timestamp = moment.unix(parseInt(val));
            switch (format.substring(0, format.length - 1)) {
                case `t`: return timestamp.format(`HH:mm`);
                case `T`: return timestamp.format(`HH:mm:ss`);
                case `d`: return timestamp.format(`DD/MM/yyyy`);
                case `D`: return timestamp.format(`DD MMMM yyyy`);
                case `F`: return timestamp.format(`dddd, DD MMMM yyyy HH:mm`);
                case `R`: return moment.duration(timestamp.diff(moment())).humanize(true);
                case `f`: return timestamp.format(`DD MMMM yyyy HH:mm`);
            }
        }
        if (tag.startsWith(`<a:`) || tag.startsWith(`<:`)) { // EMOJI
            return tag.split(`:`)[1];
        }
        return tag;
    }

    public async generateDumpPage(payload: AdvancedMessageContent, channel: Channel): Promise<Snowflake> {
        const id = snowflake.create();
        await this.database.dumps.add({
            id: id,
            content: payload.content ?? undefined,
            embeds: payload.embeds,
            channelid: snowflake.parse(channel.id),
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
        const police = await this.database.vars.get(`police`);
        return police?.value.includes(userId) ?? false;
    }

    public isBotSupport(userId: string): Promise<boolean> | boolean;
    public async isBotSupport(userId: string): Promise<boolean> {
        if (await this.isBotStaff(userId))
            return true;
        const support = await this.database.vars.get(`support`);
        return support?.value.includes(userId) ?? false;
    }

    public async getChannel(channelId: string): Promise<KnownChannel | undefined>;
    public async getChannel(guild: string | Guild, channelId: string): Promise<KnownGuildChannel | undefined>;
    public async getChannel(...args: [string] | [string | Guild, string]): Promise<KnownChannel | undefined> {
        const [guildVal, channelVal] = args.length === 2 ? args : [undefined, args[0]] as const;

        const channelId = parse.entityId(channelVal, `@!?`, true) ?? ``;
        if (channelId === ``)
            return undefined;

        if (guildVal === undefined)
            return this.discord.getChannel(channelId) ?? await this.#getRestChannel(channelId);
        const guild = typeof guildVal === `string` ? await this.getGuild(guildVal) : guildVal;
        if (guild === undefined)
            return undefined;
        const channel = guild.channels.get(channelId) ?? await this.#getRestChannel(channelId);
        return channel !== undefined && guard.isGuildChannel(channel) ? channel : undefined;
    }

    async #getRestChannel(channelId: string): Promise<KnownChannel | undefined> {
        try {
            const channel = await this.discord.getRESTChannel(channelId);
            if (guard.isPrivateChannel(channel)) {
                if (this.discord.privateChannels.get(channel.id) !== channel)
                    this.discord.privateChannels.set(channel.id, channel);
            } else {
                if (guard.isUncached(channel.guild)) {
                    channel.guild = await this.getGuild(channel.guild.id) ?? channel.guild;
                    channel.guild.channels ??= new Collection(GuildChannel as new (...args: unknown[]) => AnyGuildChannel);
                }
                if (channel.guild.channels.get(channel.id) !== channel)
                    channel.guild.channels.set(channel.id, channel);
            }
            return channel;
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError && err.code === ApiError.UNKNOWN_CHANNEL)
                return undefined;
            throw err;
        }
    }

    public async findChannels(guild: string | Guild, query?: string): Promise<KnownGuildChannel[]> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return [];

        const allChannels = [...guild.channels.values(), ...guild.threads.filter(guard.isThreadChannel)];
        if (query === undefined)
            return allChannels;

        const channel = await this.getChannel(guild, query);
        if (channel !== undefined && guard.isGuildChannel(channel) && channel.guild.id === guild.id)
            return [channel];

        return findBest(allChannels, (c) => this.channelMatchScore(c, query));
    }

    public channelMatchScore(channel: KnownChannel, query: string): number {
        const normalizedQuery = query.toLowerCase();

        if (guard.isGuildChannel(channel)) {
            if (!guard.hasValue(channel.name))
                return 0;

            const normalizedName = channel.name.toLowerCase();
            if (channel.name === query) return Infinity;
            if (channel.name.startsWith(query)) return 1000;
            if (normalizedName.startsWith(normalizedQuery)) return 100;
            if (channel.name.includes(query)) return 10;
            if (normalizedName.includes(normalizedQuery)) return 1;
        } else if (guard.isPrivateChannel(channel) && `recipient` in channel) {
            return this.userMatchScore(channel.recipient, query);
        }
        return 0;

    }

    public async getUser(userId: string): Promise<User | undefined> {
        userId = parse.entityId(userId, `@!?`, true) ?? ``;
        if (userId === ``)
            return undefined;

        try {
            return this.discord.users.get(userId) ?? await this.discord.getRESTUser(userId);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError) {
                switch (err.code) {
                    case ApiError.INVALID_FORM_BODY:
                        this.logger.error(`Error while getting user`, userId, err);
                    // fallthrough
                    case ApiError.MISSING_ACCESS:
                    case ApiError.UNKNOWN_USER:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async findUsers(guild: Guild | string, query?: string): Promise<User[]> {
        if (query !== undefined) {
            const user = await this.getUser(query);
            if (user !== undefined)
                return [user];
        }
        const members = await this.findMembers(guild, query);
        return members.map(m => m.user);
    }

    public async getGuild(guildId: string): Promise<Guild | undefined> {
        guildId = parse.entityId(guildId) ?? ``;
        if (guildId === ``)
            return undefined;

        try {
            return this.discord.guilds.get(guildId) ?? await this.discord.getRESTGuild(guildId);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError) {
                switch (err.code) {
                    case ApiError.INVALID_FORM_BODY:
                        this.logger.error(`Error while getting guild`, guildId, err);
                    // fallthrough
                    case ApiError.MISSING_ACCESS:
                    case ApiError.UNKNOWN_GUILD:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMessage(channel: string, messageId: string, force?: boolean): Promise<KnownMessage | undefined>;
    public async getMessage(channel: KnownChannel, messageId: string, force?: boolean): Promise<KnownMessage | undefined>;
    public async getMessage(channel: string | KnownChannel, messageId: string, force?: boolean): Promise<KnownMessage | undefined> {
        messageId = parse.entityId(messageId) ?? ``;
        if (messageId === ``)
            return undefined;

        const foundChannel = typeof channel === `string` ? await this.getChannel(channel) : channel;

        if (foundChannel === undefined || !guard.isTextableChannel(foundChannel))
            return undefined;

        try {
            if (force === true)
                return await foundChannel.getMessage(messageId);
            return foundChannel.messages.get(messageId) ?? await foundChannel.getMessage(messageId);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError) {
                switch (err.code) {
                    case ApiError.INVALID_FORM_BODY:
                        this.logger.error(`Error while getting message`, messageId, `in channel`, foundChannel.id, err);
                    // fallthrough
                    case ApiError.MISSING_ACCESS:
                    case ApiError.UNKNOWN_MESSAGE:
                        return undefined;
                }
            }
            throw err;
        }
    }

    public async getMember(guild: string | Guild, userId: string): Promise<Member | undefined> {
        userId = parse.entityId(userId) ?? ``;
        if (userId === ``)
            return undefined;

        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return undefined;

        try {
            return guild.members.get(userId) ?? await guild.getRESTMember(userId);
        } catch (error: unknown) {
            if (error instanceof DiscordRESTError) {
                switch (error.code) {
                    case ApiError.UNKNOWN_MEMBER:
                    case ApiError.UNKNOWN_USER:
                    case ApiError.MISSING_ACCESS:
                    case ApiError.INVALID_FORM_BODY:
                        return undefined;
                }
            }
            throw error;
        }
    }

    readonly #ensuredGuilds = new WeakSet<Guild>();
    public async ensureMemberCache(guild: Guild): Promise<void> {
        if (this.#ensuredGuilds.has(guild))
            return;

        this.#ensuredGuilds.add(guild);
        const initialSize = guild.members.size;
        await guild.fetchAllMembers();
        this.logger.info(`Cached`, guild.members.size - initialSize, `members in guild`, guild.id, `. Member cache now has`, guild.members.size, `entries`);
    }

    public async findMembers(guild: string | Guild, query?: string): Promise<Member[]> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
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

    public async getWebhook(guild: string | Guild, webhookId: string): Promise<Webhook | undefined> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return undefined;

        try {
            const webhooks = await guild.getWebhooks();
            return webhooks.find(w => w.id === webhookId);
        } catch (error: unknown) {
            if (error instanceof DiscordRESTError) {
                switch (error.code) {
                    case ApiError.MISSING_PERMISSIONS:
                    case ApiError.MISSING_ACCESS:
                        return undefined;
                }
            }
            throw error;
        }
    }

    public async findWebhooks(guild: string | Guild, query?: string): Promise<Webhook[]> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return [];

        let webhooks: Webhook[];
        try {
            webhooks = await guild.getWebhooks();
        } catch (error: unknown) {
            if (error instanceof DiscordRESTError) {
                switch (error.code) {
                    case ApiError.MISSING_PERMISSIONS:
                    case ApiError.MISSING_ACCESS:
                        return [];
                }
            }
            throw error;
        }

        if (query === undefined)
            return webhooks;

        const webhookId = parse.entityId(query) ?? ``;
        const byId = webhooks.find(w => w.id === webhookId);
        if (byId !== undefined)
            return [byId];

        return findBest(webhooks, w => this.webhookMatchScore(w, query));
    }

    public async getSender(guild: string | Guild, senderId: string): Promise<Member | Webhook | undefined> {
        senderId = parse.entityId(senderId) ?? ``;
        if (senderId === ``)
            return undefined;

        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return undefined;

        const member = await this.getMember(guild, senderId);
        if (member !== undefined)
            return member;

        return await this.getWebhook(guild, senderId);
    }

    public async findSenders(guild: string | Guild, query?: string): Promise<Array<Member | Webhook>> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return [];

        return (await Promise.all([
            this.findMembers(guild, query),
            this.findWebhooks(guild, query)
        ])).flat();
    }

    public memberMatchScore(member: Member, query: string): number {
        let score = this.userMatchScore(member.user, query);
        const displayName = member.nick ?? member.username;
        const normalizedDisplayname = displayName.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (humanize.fullName(member.user) === query) return Infinity;
        if (displayName.startsWith(query)) score += 100;
        if (normalizedDisplayname.startsWith(normalizedQuery)) score += 10;
        if (normalizedDisplayname.includes(normalizedQuery)) score += 1;
        return score;
    }

    public userMatchScore(user: User, query: string): number {
        let score = 0;
        const normalizedUsername = user.username.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (humanize.fullName(user) === query) return Infinity;
        if (user.username.startsWith(query)) score += 100;
        if (normalizedUsername.startsWith(normalizedQuery)) score += 10;
        if (normalizedUsername.includes(normalizedQuery)) score += 1;
        return score;
    }

    public webhookMatchScore(webhook: Webhook, query: string): number {
        let score = 0;
        const normalizedName = webhook.name.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (webhook.name === query) return Infinity;
        if (webhook.name.startsWith(query)) score += 100;
        if (normalizedName.startsWith(normalizedQuery)) score += 10;
        if (normalizedName.includes(normalizedQuery)) score += 1;
        return score;
    }

    public async getRole(guild: string | Guild, roleId: string): Promise<Role | undefined> {
        roleId = parse.entityId(roleId, `@&`, true) ?? ``;
        if (roleId === ``)
            return undefined;

        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;
        if (typeof guild === `string`)
            return undefined;

        try {
            return guild.roles.get(roleId);
        } catch (error: unknown) {
            if (error instanceof DiscordRESTError && error.code === ApiError.UNKNOWN_ROLE)
                return undefined;
            throw error;
        }
    }

    public async findRoles(guild: string | Guild, query?: string): Promise<Role[]> {
        if (typeof guild === `string`)
            guild = await this.getGuild(guild) ?? guild;

        if (typeof guild === `string`)
            return [];

        if (query === undefined)
            return [...guild.roles.values()];

        const role = await this.getRole(guild, query);
        if (role !== undefined)
            return [role];

        return findBest(guild.roles.values(), r => this.roleMatchScore(r, query));
    }

    public roleMatchScore(role: Role, query: string): number {
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
    [ApiError.UNKNOWN_CHANNEL]() {
        /* console.error('10003: Channel not found. ', channel); */
    },
    [ApiError.CANNOT_SEND_EMPTY_MESSAGE](util: BaseUtilities, _: unknown, payload: AdvancedMessageContent) {
        util.logger.error(`50006: Tried to send an empty message:`, payload);
    },
    [ApiError.CANNOT_MESSAGE_USER]() {
        /* console.error('50007: Can\'t send a message to this user!'); */
    },
    [ApiError.CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL]() {
        /* console.error('50008: Can\'t send messages in a voice channel!'); */
    },
    [ApiError.MISSING_PERMISSIONS](util: BaseUtilities) {
        util.logger.warn(`50013: Tried sending a message, but had no permissions!`);
        return messageNoPerms;
    },
    [ApiError.MISSING_ACCESS](util: BaseUtilities) {
        util.logger.warn(`50001: Missing Access`);
        return channelNoPerms;
    },
    [ApiError.EMBED_DISABLED](util: BaseUtilities) {
        util.logger.warn(`50004: Tried embeding a link, but had no permissions!`);
        return embedNoPerms;
    },

    // try to catch the mystery of the autoresponse-object-in-field-value error
    // https://stop-it.get-some.help/9PtuDEm.png
    [ApiError.INVALID_FORM_BODY](util: BaseUtilities, channel: TextableChannel, payload: AdvancedMessageContent, error: DiscordRESTError) {
        util.logger.error(`${channel.id}|${guard.isGuildChannel(channel) ? channel.name : `PRIVATE CHANNEL`}|${JSON.stringify(payload)}`, error);
    }
} as const;

const messageNoPerms = TranslatableString.create(`core.utils.send.error.messageNoPerms`, `I tried to send a message in response to your command, but didn't have permission to speak. If you think this is an error, please contact the staff on your guild to give me the \`Send Messages\` permission.`);
const channelNoPerms = TranslatableString.create(`core.utils.send.error.channelNoPerms`, `I tried to send a message in response to your command, but didn't have permission to see the channel. If you think this is an error, please contact the staff on your guild to give me the \`Read Messages\` permission.`);
const embedNoPerms = TranslatableString.create(`core.utils.send.error.embedNoPerms`, `I don't have permission to embed links! This will break several of my commands. Please give me the \`Embed Links\` permission. Thanks!`);
const sendErrorGuild = TranslatableString.define<{ channel: GuildChannel; message: IFormattable<string>; }, string>(`core.utils.send.error.guild`, `{message}\nGuild: {channel.guild.name} ({channel.guild.id})\nChannel: {channel.name} ({channel.id})\n\nIf you wish to stop seeing these messages, do the command \`dmerrors\`.`);
const sendErrorDm = TranslatableString.define<{ channel: Channel; message: IFormattable<string>; }, string>(`core.utils.send.error.dm`, `{message}\nChannel: PRIVATE CHANNEL ({channel.id})\n\nIf you wish to stop seeing these messages, do the command \`dmerrors\`.`);

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
const erisRequest = RequestHandler.prototype.request;
RequestHandler.prototype.request = function (...args) {
    try {
        let url;
        if (args[1].includes(`webhook`)) {
            url = `/webhooks`;
        } else {
            url = args[1].replace(/reactions\/.+(\/|$)/g, `reactions/_reaction/`).replace(/\d+/g, `_id`);
        }
        metrics.httpsRequests.labels(args[0], url).inc();
    } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    return erisRequest.call(this, ...args);
};
